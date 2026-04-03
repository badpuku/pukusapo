module AuthHelper
  def sign_in_as_request(user_id: "user_123", session_id: "sess_123")
    clerk_session = { "sid" => session_id }
    allow_any_instance_of(ApplicationController).to receive(:clerk).and_return(
      double("Clerk", session: clerk_session, user_id: user_id)
    )
  end
end

RSpec.configure do |config|
  config.include AuthHelper, type: :request
end
