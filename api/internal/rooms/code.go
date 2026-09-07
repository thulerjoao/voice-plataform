package rooms

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"unicode"
)

func normalizeCode(raw string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(raw) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(unicode.ToUpper(r))
		}
	}

	s := b.String()
	if len(s) <= 3 {
		return s
	}
	return s[:3] + "-" + s[3:]
}

const prefixAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

var codeWords = []string{
	"TIGRE", "LOBO", "URSO", "LINCE", "RAPOSA",
	"FOGO", "RAIO", "VENTO", "NUVEM", "PEDRA",
	"ASTRO", "FENIX", "AGUIA", "FALCAO", "CORVO",
	"NOVA", "DELTA", "ALFA", "BRAVO", "OSCAR",
}

func generateCode() (string, error) {
	prefix := make([]byte, 3)
	for i := range prefix {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(prefixAlphabet))))
		if err != nil {
			return "", err
		}
		prefix[i] = prefixAlphabet[n.Int64()]
	}

	wordIndex, err := rand.Int(rand.Reader, big.NewInt(int64(len(codeWords))))
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s-%s", prefix, codeWords[wordIndex.Int64()]), nil
}
