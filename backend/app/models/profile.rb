class Profile < ApplicationRecord
  belongs_to :role

  delegate :permission_level, to: :role

  def moderator?
    permission_level >= 5
  end

  def admin?
    permission_level >= 10
  end
end
