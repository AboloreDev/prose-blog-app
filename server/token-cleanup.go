package main

import "time"

func (app *Application) StartTokenCleanUp() {
	ticker := time.NewTicker(1 * time.Hour)

	go func ()  {
		for {
			select {
			case <- ticker.C:
				err := app.authRepo.DeleteExpiredTokens()
				if err != nil {
					app.errorLog.Printf("Failed to delete token %v", err)
				} else {
					app.infoLog.Println("Token Clean up successfull")
				}
			case <- app.stopChan:
				ticker.Stop()
				return
			}
		}
	}()
}