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
	"prose-blog/comments"
	"prose-blog/community"
	"prose-blog/followers"
	"prose-blog/migration"
	"prose-blog/posts"
	ratelimit "prose-blog/rate-limit"
	"prose-blog/users"
	"prose-blog/votes"
	"sync"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Application struct {
	errorLog *log.Logger
	infoLog  *log.Logger
	limiter  *ratelimit.IPLimiter
	userRepo users.UserRepository
	authRepo auth.AuthRepository
	postRepo posts.PostRepository
	commentRepo comments.CommentsRepository
	commRepo community.CommunityRepository
	votesRepo votes.VoteRepository
	followersRepo followers.FollowersRepository
	stopChan chan struct{}
	server 	 *http.Server
	scheduleList map[int]chan struct{}
	schedulerMutex sync.Mutex
}

func main() {
	godotenv.Load()
	db, err := connectDb()
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
		commentRepo: comments.NewSQLCommentsRepository(db),
		commRepo: community.NewSQLCommunityRepository(db),
		votesRepo: votes.NewSQLVoteRepository(db),
		followersRepo: followers.NewSQLFollowersRepository(db),
		stopChan: make(chan struct{}),
		postRepo: posts.NewSQLPostRepository(db),
		scheduleList: make(map[int]chan struct{}),
	}
	
	err = app.RestoreScheduledPosts()
	if err != nil {
		app.errorLog.Printf("failed to restore scheduled posts: %v", err)
	}

	app.StartTokenCleanUp()

	errCh := make(chan error, 1)
	go func (){
		app.infoLog.Println("Server started on PORT 9000")
		errCh <-app.Serve()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	select{
	case err := <-errCh:
		app.errorLog.Fatal("server error:", err)
	case <-quit:
		app.infoLog.Println("Shutting down server...")
	}

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := app.server.Shutdown(ctx); err != nil {
        app.errorLog.Fatal("server shutdown failed:", err)
    }

    close(app.stopChan)

    app.infoLog.Println("server stopped cleanly")
}


func connectDb() (*sql.DB, error) {
	conn := os.Getenv("DATABASE_URL")
	if conn == "" {
        log.Fatal("DATABASE_URL environment variable not set")
    }
	
	db, err := sql.Open("postgres", conn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}
  
	_, err = db.Exec("PRAGMA journal_mode=WAL")
	_, err = db.Exec("PRAGMA foreign_keys=ON")

	migrator := migration.NewMigrator(db)
    err = migrator.RunMigrations()
    if err != nil {
        return nil, fmt.Errorf("migrations failed: %w", err)
    }

	db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(25)
    db.SetConnMaxIdleTime(5 * time.Minute)
    db.SetConnMaxLifetime(2 * time.Hour)

	return db, nil
}