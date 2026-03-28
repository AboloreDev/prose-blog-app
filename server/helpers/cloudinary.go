package helpers

import (
	"context"
	"mime/multipart"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadImage(file multipart.File) (string, error) {
	cstring, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)
	if err != nil {
		return "", err
	}

	ctx := context.Background()

	result, err := cstring.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder: "prose",
	})

	if err != nil {
		return "", err
	}

	return result.SecureURL, err
}