package version

import "testing"

func TestCompare(t *testing.T) {
	if Compare("0.0.1", "0.0.1") != 0 {
		t.Fatal("equal")
	}
	if Compare("0.0.2", "0.0.1") <= 0 {
		t.Fatal("patch should win")
	}
	if Compare("0.0.1", "0.1.0") >= 0 {
		t.Fatal("minor should win")
	}
	if Compare("", "0.0.1") >= 0 {
		t.Fatal("empty is older")
	}
}

func TestBelowMinUsesDefault(t *testing.T) {
	if !BelowMin("") {
		t.Fatal("missing version is below min")
	}
	if BelowMin(Default) {
		t.Fatal("current default must pass")
	}
}
