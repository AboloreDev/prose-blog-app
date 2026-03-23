package main

import (
	"net/http"
	"time"
)

func (app *Application) Serve() error {
	app.server = &http.Server{
		Addr:         ":9000",
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout: 60 *time.Second,
		Handler: app.Routes(),
	}

	return app.server.ListenAndServe()
}
