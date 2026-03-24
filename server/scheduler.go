package main

import (
	"errors"
	"time"
)


var ErrNoScheduledPost = errors.New("No Scheduled Post")

func (app *Application) SchedulePost(postId int, publishAt time.Time){
	cancelChan := make(chan struct{})

	app.schedulerMutex.Lock()
	app.scheduleList[postId] = cancelChan
	app.schedulerMutex.Unlock()

	duration := time.Until(publishAt)

	go func(){
		timer := time.NewTimer(duration)
		defer timer.Stop()

		select {
			case <- timer.C:
			err := app.postRepo.PublishPost(postId)
			if err != nil {
				app.errorLog.Printf("Failed to publish scheduled post %v", err)
			} else {
				app.infoLog.Printf("scheduled post %d published successfully", postId)
			}

			app.schedulerMutex.Lock()
			delete(app.scheduleList, postId)
			app.schedulerMutex.Unlock()
			
			case <- cancelChan:

			app.infoLog.Printf("scheduled post %d cancelled", postId)
			app.schedulerMutex.Lock()
			delete(app.scheduleList, postId)
			app.schedulerMutex.Unlock()
		}
	}()
}


func (app *Application) CancelScheduledPost(postId int) error {
	app.schedulerMutex.Lock()
	cancelCh, exists := app.scheduleList[postId]
	app.schedulerMutex.Unlock()

	if !exists {
		return ErrNoScheduledPost
	}

	close(cancelCh)
	return nil
}


func (app *Application) RestoreScheduledPosts() error {
	allScheduledPosts, err := app.postRepo.GetScheduledPosts()
	if err != nil {
		return err
	}

	for _, post := range allScheduledPosts{
		if post.PublishAt.After(time.Now()) {
			app.SchedulePost(post.ID, post.PublishAt)
			app.infoLog.Printf("restored scheduler for post %d", post.ID)
		} else {
			app.postRepo.PublishPost(post.ID)
			app.infoLog.Printf("published overdue post %d", post.ID)
		}
	}

	return nil
}