class ApplicationController < ActionController::API
  include Clerk::Authenticatable

  private

  def require_auth!
    unless clerk.session
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
