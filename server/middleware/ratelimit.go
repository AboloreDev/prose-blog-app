package middleware

import (
	"net"
	"net/http"
	ratelimit "prose-blog/rate-limit"
)

func PerClientRateLimiter(limiter *ratelimit.IPLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				http.Error(
					w, "Internal Server Error", http.StatusInternalServerError,
				)
			}

			if !limiter.Allow(ip) {
				http.Error(
					w, "Too Many Request", http.StatusTooManyRequests,
				)
			}
			next.ServeHTTP(w, r)
		})
	}
}
