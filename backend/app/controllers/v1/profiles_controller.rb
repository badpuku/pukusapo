class V1::ProfilesController < ApplicationController
  before_action :require_auth!

  def me
    profile = Profile.find_by(user_id: clerk.user_id)

    if profile.nil?
      return render json: { error: "Profile not found" }, status: :not_found
    end

    render json: profile
  end
end
