class SessionController < ApplicationController
  before_action :require_auth!

  def show
    render json: {
      user_id: clerk.user_id,
      session_id: clerk.session&.dig("sid")
    }
  end
end