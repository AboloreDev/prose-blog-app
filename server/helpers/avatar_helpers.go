package helpers


var PresetAvatars = []string{
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542257/man_xvljkb.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542257/woman_ijlpal.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542257/hacker_qnzqmn.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542257/avatar_xv9y7r.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542256/man_1_ofnmrt.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542256/dinosaur_dzojsb.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542256/gorilla_hhxnh3.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542256/boy_gsqmyc.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542256/woman_1_osikj3.png",
    "https://res.cloudinary.com/diliu1rdq/image/upload/v1774542197/duck_hnweur.png",
}

func IsValidAvatar(url string) bool {
	for _, avatar := range PresetAvatars {
		if avatar == url {
			return true
		}
	}
	return false
}