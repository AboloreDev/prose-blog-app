package main

import (
	"database/sql"
	"log"
	"os"
	"prose-blog/auth"
	"prose-blog/comments"
	"prose-blog/community"
	"prose-blog/followers"
	"prose-blog/karma"
	"prose-blog/notifications"
	"prose-blog/posts"
	ratelimit "prose-blog/rate-limit"
	"prose-blog/users"
	"prose-blog/votes"
	"testing"
)

var testDB *sql.DB
var testApp *Application

func TestMain(m *testing.M) {
	var err error
	testDB, err := sql.Open("postgres", ":memory:")
	if err != nil {
		panic(err)
	}

	err = testDB.Ping()
	if err != nil {
		panic(err)
	}

	testApp = setupApp(testDB)

	code := m.Run()
	testDB.Close()
	os.Exit(code)
	
}

func setupApp(db *sql.DB) *Application {
	 errorLog := log.New(os.Stderr, "ERROR\t", log.Ltime|log.LstdFlags|log.Lmicroseconds|log.Lshortfile)
    infoLog  := log.New(os.Stdout, "INFO\t", log.Ltime|log.LstdFlags)

    userRepo     := users.NewSQLUserRepository(db)
    authRepo     := auth.NewSQLAuthRepository(db)
    postRepo     := posts.NewSQLPostRepository(db)
    commentRepo  := comments.NewSQLCommentsRepository(db)
    commRepo     := community.NewSQLCommunityRepository(db)
    votesRepo    := votes.NewSQLVoteRepository(db)
    followersRepo := followers.NewSQLFollowersRepository(db)

    notificationsRepo  := notifications.NewNotificationRepository(db)
    notificationWorker := notifications.NewNotificationWorker(notificationsRepo)
    karmaWorker        := karma.NewKarmaWorker(userRepo, errorLog, infoLog)


	app := &Application{
        errorLog:           errorLog,
        infoLog:            infoLog,
        limiter:            ratelimit.NewIPLimiter(10, 20),
        userRepo:           userRepo,
        authRepo:           authRepo,
        postRepo:           postRepo,
        commentRepo:        commentRepo,
        commRepo:           commRepo,
        votesRepo:          votesRepo,
        followersRepo:      followersRepo,
        stopChan:           make(chan struct{}),
        scheduleList:       make(map[int]chan struct{}),
        notificationWorker: notificationWorker,
        karmaWorker:        karmaWorker,
    }

	return app
}