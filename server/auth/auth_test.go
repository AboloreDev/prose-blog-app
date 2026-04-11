package auth

import "testing"

func TestGenerateAccessToke(t *testing.T) {
	userID := 1

	token, err := GenerateAccessToken(userID)
	if err != nil {
		t.Errorf("expected no error, got error %v", err)
	}

	if token == "" {
		t.Error("Expected token, got empty string")
	}

	cl, err := ValidateAccessToken(token)
	if err != nil {
		t.Errorf("Expected no error, got error %v", err)
	}

	if cl.UserID != userID {
		t.Errorf("want %d, got %d", cl.UserID, userID)
	}
}

func TestValidateAccessToken(t *testing.T) {
	tests := []struct{
		name string
		token string
		expectErr bool
	}{
		{
			name: "Valid Token",
			token: "",
			expectErr: false,
		},
		{
			name: "Invalid Token",
			token: "",
			expectErr: true,
		},
		{
			name: "Tampared Token",
			token: "u46IpCV9y5VlurXXXODJEhgOY8m9JVE4.tamper.token",
			expectErr: true,
		},
	}

	validToken, _ := GenerateAccessToken(1)
	tests[0].token = validToken

	for _, tt := range tests {
		_, err := ValidateAccessToken(tt.token)
		if tt.expectErr && err == nil {
			t.Error("Expects Error but got no error")
		}

		if !tt.expectErr && err != nil {
			t.Errorf("Expected no error but got %v", err)
		}
	}
	
}