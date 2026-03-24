package helpers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"prose-blog/posts"
)



func WriteJSON(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	return json.NewEncoder(w).Encode(data)
}

func ReadJSON(r *http.Request, data interface{}) error{
	return json.NewDecoder(r.Body).Decode(data)
}


func BuildPaginationURLs(filter posts.Filter, metadata posts.MetaData) (string, string) {
    next := ""
    prev := ""

    if metadata.NextPage > 0 {
        next = fmt.Sprintf("/?q=%s&order_by=%s&page=%d&page_size=%d",
            filter.Query, filter.OrderBy, metadata.NextPage, filter.PageSize)
    }

    if metadata.PreviousPage > 0 {
        prev = fmt.Sprintf("/?q=%s&order_by=%s&page=%d&page_size=%d",
            filter.Query, filter.OrderBy, metadata.PreviousPage, filter.PageSize)
    }

    return next, prev
}