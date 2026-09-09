package version

import (
	"os"
	"strconv"
	"strings"
)

const Default = "0.0.1"

func Current() string {
	if value := strings.TrimSpace(os.Getenv("CLIENT_VERSION")); value != "" {
		return value
	}
	return Default
}

func Min() string {
	if value := strings.TrimSpace(os.Getenv("CLIENT_MIN_VERSION")); value != "" {
		return value
	}
	return Default
}

func BelowMin(value string) bool {
	return Compare(value, Min()) < 0
}

func Compare(left, right string) int {
	a := parse(left)
	b := parse(right)
	for i := 0; i < 3; i++ {
		if a[i] < b[i] {
			return -1
		}
		if a[i] > b[i] {
			return 1
		}
	}
	return 0
}

func parse(value string) [3]int {
	var out [3]int
	parts := strings.Split(strings.TrimSpace(value), ".")
	for i := 0; i < 3 && i < len(parts); i++ {
		n, err := strconv.Atoi(parts[i])
		if err != nil || n < 0 {
			return [3]int{}
		}
		out[i] = n
	}
	return out
}
