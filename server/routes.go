package main

import (
	"net/http"
	"prose-blog/middleware"
)

func (app *Application) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/v1/auth/register", app.RegisterUser)
	mux.HandleFunc("POST /api/v1/auth/login", app.LoginUser)
	mux.HandleFunc("GET /api/v1/auth/refresh", app.RefreshToken)
	mux.HandleFunc("POST /api/v1/auth/logout", app.LogoutUser)

	var handler http.Handler = mux
	handler = middleware.CORS(handler)
	handler = middleware.PerClientRateLimiter(app.limiter)(handler)
	handler = middleware.Logger(app.infoLog)(handler)
	handler = middleware.Recover(app.errorLog)(handler)

	return handler
}
