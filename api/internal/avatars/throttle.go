package avatars

import (
	"io"
	"net/http"
	"time"
)

type throttledWriter struct {
	w           http.ResponseWriter
	bytesPerSec int
	written     int
	started     time.Time
}

func newThrottledWriter(w http.ResponseWriter, bytesPerSec int) *throttledWriter {
	if bytesPerSec <= 0 {
		bytesPerSec = BytesPerSec
	}
	return &throttledWriter{
		w:           w,
		bytesPerSec: bytesPerSec,
		started:     time.Now(),
	}
}

func (t *throttledWriter) Header() http.Header {
	return t.w.Header()
}

func (t *throttledWriter) WriteHeader(statusCode int) {
	t.w.WriteHeader(statusCode)
}

func (t *throttledWriter) Write(p []byte) (int, error) {
	total := 0
	for total < len(p) {
		end := total + 4*1024
		if end > len(p) {
			end = len(p)
		}
		n, err := t.w.Write(p[total:end])
		total += n
		t.written += n
		if err != nil {
			return total, err
		}
		elapsed := time.Since(t.started)
		expected := time.Duration(float64(t.written) / float64(t.bytesPerSec) * float64(time.Second))
		if expected > elapsed {
			time.Sleep(expected - elapsed)
		}
	}
	return total, nil
}

func throttleCopy(w http.ResponseWriter, r io.Reader) error {
	_, err := io.Copy(newThrottledWriter(w, BytesPerSec), r)
	return err
}
