class RolePermission < ApplicationRecord
  self.primary_key = [ :role_id, :permission_id ]

  belongs_to :role
  belongs_to :permission
end
