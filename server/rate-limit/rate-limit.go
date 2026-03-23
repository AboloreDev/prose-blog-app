package ratelimit

import (
	"sync"

	"golang.org/x/time/rate"
)

type IPLimiter struct {
	Limiters map[string]*rate.Limiter
	Mutex sync.Mutex
	Rate rate.Limit
	Burst int
}

func NewIPLimiter(r rate.Limit, burst int) *IPLimiter {
	return &IPLimiter{
		Limiters: make(map[string]*rate.Limiter),
		Rate: r,
		Burst: burst,
	}
}


func (i *IPLimiter) GetLimiter(ip string) *rate.Limiter {
	i.Mutex.Lock()
	defer i.Mutex.Unlock()

	limiter, exists := i.Limiters[ip]
	if !exists {
		limiter = rate.NewLimiter(i.Rate, i.Burst)
		i.Limiters[ip] = limiter
	}

	return limiter
}

func (i *IPLimiter) Allow(ip string) bool {
	return i.GetLimiter(ip).Allow()
}