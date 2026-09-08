package identity

import (
	"strings"
	"testing"
)

func TestGenerateRecoveryCodeFormat(t *testing.T) {
	code, err := generateRecoveryCode()
	if err != nil {
		t.Fatal(err)
	}
	if len(code) != 24 {
		t.Fatalf("len=%d code=%q", len(code), code)
	}
	normalized := normalizeRecoveryCode(code)
	if len(normalized) != recoveryCodeChars {
		t.Fatalf("normalized len=%d", len(normalized))
	}
	for _, r := range normalized {
		if !strings.ContainsRune(recoveryAlphabet, r) {
			t.Fatalf("unexpected rune %q in %q", r, code)
		}
	}
	if formatRecoveryCode(normalized) != code {
		t.Fatalf("format(normalized)=%q want %q", formatRecoveryCode(normalized), code)
	}
}

func TestHashRecoveryCodeIgnoresHyphensAndCase(t *testing.T) {
	a, err := hashRecoveryCode("7K2M-9QWX-4HLP-T3VN-8CFR")
	if err != nil {
		t.Fatal(err)
	}
	b, err := hashRecoveryCode("7k2m9qwx4hlpt3vn8cfr")
	if err != nil {
		t.Fatal(err)
	}
	if a != b {
		t.Fatalf("hashes differ:\n%s\n%s", a, b)
	}
}

func TestHashRecoveryCodeRejectsShortInput(t *testing.T) {
	if _, err := hashRecoveryCode("ABCD-EFGH"); err == nil {
		t.Fatal("expected error")
	}
}
