require 'rails_helper'

RSpec.describe "V1::Profiles" do
  describe "GET /v1/profiles/me" do
    context 'when authenticated' do
      # TODO: テスト DB に seed データが残っているため find_or_create にしている。
      #       db:test:prepare の挙動を見直し、seed に依存しない形にする。
      let(:role) { Role.find_by(code: "user") || create(:role, :user) }
      let(:profile) do
        create(:profile, user_id: "user_abc", username: "testuser", role: role)
      end

      before do
        sign_in_as_request(user_id: profile.user_id)
      end

      it 'returns the profile with role' do
        get "/v1/profiles/me"

        expect(response).to have_http_status(:ok)

        body = response.parsed_body
        expect(body["user_id"]).to eq("user_abc")
        expect(body["username"]).to eq("testuser")
        expect(body["role"]["code"]).to eq("user")
        expect(body["role"]["permission_level"]).to eq(1)
      end
    end

    context 'when authenticated but profile does not exist' do
      before do
        sign_in_as_request(user_id: "user_no_profile")
      end

      it 'returns 404 not found' do
        get "/v1/profiles/me"

        expect(response).to have_http_status(:not_found)
        expect(response.parsed_body["error"]).to eq("Profile not found")
      end
    end

    context 'when not authenticated' do
      it 'returns 401 unauthorized' do
        allow_any_instance_of(ApplicationController).to receive(:clerk).and_return(
          double("Clerk", session: nil, user_id: nil)
        )

        get "/v1/profiles/me"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
