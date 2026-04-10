package karma

import (
	"log"
	"prose-blog/users"
	"time"
)

type KarmaEvent struct {
	UserID int `json:"user_id"`
	Delta int `json:"delta"`
}

type KarmaWorker struct {
	karmaQueueChan chan KarmaEvent
	stopChan chan struct {}
	repo users.UserRepository
	errorLog *log.Logger
	infoLog *log.Logger
	ticker *time.Ticker
}

func NewKarmaWorker(repo users.UserRepository, errorLog, infoLog *log.Logger) *KarmaWorker {
	return &KarmaWorker{
		repo: repo,
		errorLog: errorLog,
		infoLog: infoLog,
		ticker: time.NewTicker(30 * time.Second),
		karmaQueueChan: make(chan KarmaEvent, 500),
		stopChan: make(chan struct{}),
	}
}

func (kw *KarmaWorker) Start(){
	pending := make(map[int]int)

	go func() {
		for {
			select {
			case event := <- kw.karmaQueueChan:
				pending[event.UserID] = pending[event.UserID] + event.Delta
				kw.infoLog.Printf(
                    "karma event received: userID=%d delta=%d pending=%d",
                    event.UserID, event.Delta, pending[event.UserID],
                )
			
			case <- kw.ticker.C:
				if len(pending) == 0 {
					continue
				}
				kw.infoLog.Printf("flushing karma for %d users", len(pending))

				for userID, delta := range pending {
					err := kw.repo.UpdateKarmaPoints(userID, delta)
						if err != nil {
                        kw.errorLog.Printf(
                            "failed to update karma for user %d: %v",
                            userID, err,
                        )
                    } else {
                        kw.infoLog.Printf(
                            "karma updated: userID=%d delta=%d",
                            userID, delta,
                        )
                    }
				}

				pending = make(map[int]int)

			case <-kw.stopChan:
				 kw.infoLog.Println("karma worker shutting down — flushing remaining events")
                for userID, delta := range pending {
                    err := kw.repo.UpdateKarmaPoints(userID, delta)
                    if err != nil {
                        kw.errorLog.Printf(
                            "shutdown flush failed for user %d: %v",
                            userID, err,
                        )
                    }
                }
                kw.ticker.Stop()
                kw.infoLog.Println("karma worker stopped")
                return
			}
		}
	}()
}

func (kw *KarmaWorker) Send(event KarmaEvent) {
    select {
    case kw.karmaQueueChan <- event:
        kw.infoLog.Printf("Sending event to the queue channel %v", event)
    default:
        kw.errorLog.Printf("karma queue full — skipping event for user %d", event.UserID)
    }
}

func (kw *KarmaWorker) Stop(){
	close(kw.stopChan)
}