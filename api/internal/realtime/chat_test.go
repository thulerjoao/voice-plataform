package realtime

import (
	"testing"
	"unicode/utf8"
)

func TestClipRunes(t *testing.T) {
	if got := clipRunes("  oi  ", ChatTextMax); got != "oi" {
		t.Fatalf("trim: %q", got)
	}
	long := stringsRepeat("a", ChatTextMax+8)
	got := clipRunes(long, ChatTextMax)
	if utf8.RuneCountInString(got) != ChatTextMax {
		t.Fatalf("got %d runes", utf8.RuneCountInString(got))
	}
}

func TestChatIDFallback(t *testing.T) {
	if chatID("") == "" {
		t.Fatal("empty id should be replaced")
	}
	if got := chatID("msg-1"); got != "msg-1" {
		t.Fatalf("got %q", got)
	}
}

func stringsRepeat(value string, n int) string {
	out := make([]byte, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, value...)
	}
	return string(out)
}
