require 'rails_helper'

RSpec.describe "Sessions" do
  describe "GET /session" do
    context 'when authenticated' do
      it 'returns user_id and session_id' do
        sign_in_as_request(user_id: "user_abc", session_id: "sess_xyz")

        get "/session"

        expect(response).to have_http_status(:ok)
        body = response.parsed_body
        expect(body["user_id"]).to eq("user_abc")
        expect(body["session_id"]).to eq("sess_xyz")
      end
    end

    context 'when not authenticated' do
      it 'returns 401 unauthorized' do
        allow_any_instance_of(ApplicationController).to receive(:clerk).and_return(
          double("Clerk", session: nil, user_id: nil)
        )

        get "/session"

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body["error"]).to eq("Unauthorized")
      end
    end
  end
end
