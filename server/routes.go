package main

import (
	"net/http"
	"prose-blog/middleware"
)

func (app *Application) Routes() http.Handler {
    mux := http.NewServeMux()

    // Auth
    mux.HandleFunc("POST /api/v1/auth/register", app.RegisterUser)
    mux.HandleFunc("POST /api/v1/auth/login", app.LoginUser)
    mux.HandleFunc("POST /api/v1/auth/refresh", app.RefreshToken)
    mux.HandleFunc("POST /api/v1/auth/logout", app.LogoutUser)

    // Users
    mux.HandleFunc("GET /api/v1/users", app.GetAllUsers)
    mux.HandleFunc("GET /api/v1/users/{id}", app.GetUserById)
    mux.Handle("PATCH /api/v1/users",
        middleware.RequireAuth(http.HandlerFunc(app.UpdateUser)),
    )
    mux.Handle("DELETE /api/v1/users",
        middleware.RequireAuth(http.HandlerFunc(app.DeleteUser)),
    )

    // Followers
    mux.Handle("POST /api/v1/users/{id}/follow",
        middleware.RequireAuth(http.HandlerFunc(app.FollowUser)),
    )
    mux.Handle("DELETE /api/v1/users/{id}/follow",
        middleware.RequireAuth(http.HandlerFunc(app.UnfollowUser)),
    )
    mux.HandleFunc("GET /api/v1/users/{id}/followers", app.GetFollowers)
    mux.HandleFunc("GET /api/v1/users/{id}/following", app.GetFollowing)
    mux.HandleFunc("GET /api/v1/users/{id}/followcount", app.GetFollowCount)
    mux.Handle("GET /api/v1/users/{id}/isfollowing",
        middleware.RequireAuth(http.HandlerFunc(app.IsFollowing)),
    )

    // Posts
    mux.HandleFunc("GET /api/v1/posts", app.Homepage)
    mux.HandleFunc("GET /api/v1/posts/{id}", app.GetSinglePost)
    mux.Handle("POST /api/v1/posts",
        middleware.RequireAuth(http.HandlerFunc(app.CreatePost)),
    )
    mux.Handle("PATCH /api/v1/posts/{id}",
        middleware.RequireAuth(http.HandlerFunc(app.UpdateAPost)),
    )
    mux.Handle("DELETE /api/v1/posts/{id}",
        middleware.RequireAuth(http.HandlerFunc(app.DeletePost)),
    )
    mux.Handle("GET /api/v1/posts/user",
        middleware.RequireAuth(http.HandlerFunc(app.GetUserPosts)),
    )
    mux.Handle("GET /api/v1/posts/drafts",
        middleware.RequireAuth(http.HandlerFunc(app.GetUserPostsDraft)),
    )
    mux.Handle("GET /api/v1/posts/scheduled",
        middleware.RequireAuth(http.HandlerFunc(app.GetUserScheduledPosts)),
    )

    // Post votes
    mux.Handle("POST /api/v1/posts/{id}/vote",
        middleware.RequireAuth(http.HandlerFunc(app.VotePost)),
    )
    mux.HandleFunc("GET /api/v1/posts/{id}/votes", app.GetAllPostVote)
    mux.Handle("DELETE /api/v1/posts/{id}/vote",
        middleware.RequireAuth(http.HandlerFunc(app.DeletePostVotes)),
    )

    // Comments
    mux.Handle("POST /api/v1/posts/{id}/comments",
        middleware.RequireAuth(http.HandlerFunc(app.CreateComment)),
    )
    mux.HandleFunc("GET /api/v1/posts/{id}/comments", app.GetCommentsByPost)
    mux.HandleFunc("GET /api/v1/comments/{id}", app.GetCommentById)
    mux.HandleFunc("GET /api/v1/comments/{id}/replies", app.GetNestedComments)
    mux.Handle("PATCH /api/v1/comments/{id}",
        middleware.RequireAuth(http.HandlerFunc(app.UpdateComment)),
    )
    mux.Handle("DELETE /api/v1/comments/{id}",
        middleware.RequireAuth(http.HandlerFunc(app.DeleteComment)),
    )

    // Comment votes
    mux.Handle("POST /api/v1/comments/{id}/vote",
        middleware.RequireAuth(http.HandlerFunc(app.VoteComment)),
    )
    mux.HandleFunc("GET /api/v1/comments/{id}/votes", app.GetAllCommentVote)
    mux.Handle("DELETE /api/v1/comments/{id}/vote",
        middleware.RequireAuth(http.HandlerFunc(app.DeleteCommentVotes)),
    )

    // Communities
    mux.HandleFunc("GET /api/v1/communities", app.GetAllCommunities)
    mux.HandleFunc("GET /api/v1/communities/{id}", app.GetCommunityById)
    mux.HandleFunc("GET /api/v1/community-posts/{id}", app.GetPostByCommunity)
    mux.HandleFunc("GET /api/v1/communities/{id}/members", app.GetAllCommunityMembers)
    mux.Handle("POST /api/v1/communities",
        middleware.RequireAuth(http.HandlerFunc(app.CreateCommunity)),
    )
    mux.Handle("PATCH /api/v1/communities/{id}",
        middleware.RequireAuth(http.HandlerFunc(app.UpdateCommunity)),
    )
    mux.Handle("DELETE /api/v1/communities/{id}",
        middleware.RequireAuth(http.HandlerFunc(app.DeleteCommunity)),
    )
    mux.Handle("POST /api/v1/communities/{id}/join",
        middleware.RequireAuth(http.HandlerFunc(app.JoinCommunity)),
    )
    mux.Handle("DELETE /api/v1/communities/{id}/join",
        middleware.RequireAuth(http.HandlerFunc(app.LeaveCommunity)),
    )

    // Middleware chain
    var handler http.Handler = mux
    handler = middleware.CORS(handler)
    handler = middleware.PerClientRateLimiter(app.limiter)(handler)
    handler = middleware.Logger(app.infoLog)(handler)
    handler = middleware.Recover(app.errorLog)(handler)

    return handler
}
