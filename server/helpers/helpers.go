package helpers

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
)

type Filter struct {
	Page int `json:"page"`
	PageSize int `json:"page_size"`
	OrderBy string `json:"order_by"`
	Query string `json:"query"`
}

type MetaData struct {
	CurrentPage int `json:"current_page"`
	PageSize int `json:"page_size"`
	NextPage int `json:"next_page"`
	PreviousPage int `json:"prev_page"`
	FirstPage int `json:"first_page"`
	LastPage int `json:"last_page"`
	TotalRecords int `json:"total_records"`
}

var ErrInvalidPageRange = errors.New("invalid page range: 1 to 100 max")

func WriteJSON(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	return json.NewEncoder(w).Encode(data)
}

func ReadJSON(r *http.Request, data interface{}) error{
	return json.NewDecoder(r.Body).Decode(data)
}


func BuildPostsPaginationURLs(filter Filter, metadata MetaData) (string, string) {
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

func BuildCommentsPaginationURLs(filter Filter, metadata MetaData) (string, string) {
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

func BuildCommunitiesPaginationURLs(filter Filter, metadata MetaData) (string, string) {
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

func CalculateMetaData(totalRecords, page, pageSize int) MetaData {
	meta := MetaData{
		CurrentPage:  page,
		PageSize:     pageSize,
		FirstPage:    1,
		LastPage:     int(math.Ceil(float64(totalRecords) / float64(pageSize))),
		TotalRecords: totalRecords,
	}
	meta.NextPage = meta.CurrentPage + 1
	meta.PreviousPage = meta.CurrentPage - 1
	if meta.CurrentPage <= meta.FirstPage {
		meta.PreviousPage = 0
	}
	if meta.CurrentPage >= meta.LastPage {
    meta.NextPage = 0
	}

	return meta
}


func (f *Filter) Validate() error {
	if f.PageSize <= 0 || f.PageSize >= 100 {
		return ErrInvalidPageRange
	}
	return nil
}