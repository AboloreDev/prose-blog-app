package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"prose-blog/auth"
	"prose-blog/migration"
	"prose-blog/posts"
	ratelimit "prose-blog/rate-limit"
	"prose-blog/users"
	"sync"
	"syscall"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type Application struct {
	errorLog *log.Logger
	infoLog  *log.Logger
	limiter  *ratelimit.IPLimiter
	userRepo users.UserRepository
	authRepo auth.AuthRepository
	postRepo posts.PostRepository
	stopChan chan struct{}
	server 	 *http.Server
	scheduleList map[int]chan struct{}
	schedulerMutex sync.Mutex
}

func main() {
	dbName := "prose_blog_database.db"
	db, err := connectDb(dbName)
	if err != nil {
		log.Fatal("Failed to connect to db", err)
	}
	defer db.Close()
	fmt.Println("Database connection successful")

	app := &Application{
		errorLog: log.New(os.Stderr, "ERROR\t", log.Ltime|log.LstdFlags|log.Lmicroseconds|log.Lshortfile),
		infoLog:  log.New(os.Stdout, "INFO\t", log.Ltime|log.LstdFlags),
		limiter:  ratelimit.NewIPLimiter(10, 20),
		userRepo: users.NewSQLUserRepository(db),
		authRepo: auth.NewSQLAuthRepository(db),
		stopChan: make(chan struct{}),
		postRepo: posts.NewSQLPostRepository(db),
		scheduleList: make(map[int]chan struct{}),
	}
	
	err = app.RestoreScheduledPosts()
	if err != nil {
		app.errorLog.Printf("failed to restore scheduled posts: %v", err)
	}


	// Clean up expired refresh tokens in the db
	app.StartTokenCleanUp()

	// Start server on go routines so it doesnt block
	// the graceful shoutdown signal from stopChan
	go func (){
		app.infoLog.Println("Server started on PORT 9000")
		err = app.Serve()
		if err != nil {
			app.errorLog.Fatal("opening port failed:", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	app.infoLog.Println("Shutting down server")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := app.server.Shutdown(ctx); err != nil {
        app.errorLog.Fatal("server shutdown failed:", err)
    }

    close(app.stopChan)

    db.Close()

    app.infoLog.Println("server stopped cleanly")
}


func connectDb(name string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", name)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}
  
	migrator := migration.NewMigrator(db)
    err = migrator.RunMigrations()
    if err != nil {
        return nil, fmt.Errorf("migrations failed: %w", err)
    }

	return db, nil
}