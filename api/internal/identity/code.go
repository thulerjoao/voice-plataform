package identity

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"
	"unicode"
)

const (
	recoveryAlphabet  = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	recoveryGroups    = 5
	recoveryGroupLen  = 4
	recoveryCodeChars = recoveryGroups * recoveryGroupLen
)

func generateRecoveryCode() (string, error) {
	chars := make([]byte, recoveryCodeChars)
	for i := range chars {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(recoveryAlphabet))))
		if err != nil {
			return "", err
		}
		chars[i] = recoveryAlphabet[n.Int64()]
	}
	return formatRecoveryCode(string(chars)), nil
}

func formatRecoveryCode(raw string) string {
	s := normalizeRecoveryCode(raw)
	if len(s) != recoveryCodeChars {
		return s
	}
	parts := make([]string, 0, recoveryGroups)
	for i := 0; i < recoveryGroups; i++ {
		start := i * recoveryGroupLen
		parts = append(parts, s[start:start+recoveryGroupLen])
	}
	return strings.Join(parts, "-")
}

func normalizeRecoveryCode(raw string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(raw) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(unicode.ToUpper(r))
		}
	}
	return b.String()
}

func hashRecoveryCode(raw string) (string, error) {
	normalized := normalizeRecoveryCode(raw)
	if len(normalized) != recoveryCodeChars {
		return "", fmt.Errorf("invalid recovery code")
	}
	sum := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(sum[:]), nil
}
