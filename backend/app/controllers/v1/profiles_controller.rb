class V1::ProfilesController < ApplicationController
  before_action :require_auth!

  def me
    profile = Profile.find_by(user_id: clerk.user_id)

    if profile.nil?
      return render json: { error: "Profile not found" }, status: :not_found
    end

    render json: profile_json(profile)
  end

  private

  def profile_json(profile)
    {
      id: profile.id,
      user_id: profile.user_id,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      role: role_json(profile.role)
    }
  end

  def role_json(role)
    {
      code: role.code,
      name: role.name,
      permission_level: role.permission_level
    }
  end
end
