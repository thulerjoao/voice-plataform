package realtime

import (
	"context"
	"testing"
)

func TestActivitySkipsEmpty(t *testing.T) {
	activity := NewActivity(NewHub())
	activity.Sala(context.Background(), nil, "", "channel", "texto")
	activity.Sala(context.Background(), nil, "room", "channel", "")
	activity.Server(context.Background(), nil, "", "texto")
	activity.Server(context.Background(), nil, "room", "  ")
}
