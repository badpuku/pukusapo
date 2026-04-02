require 'rails_helper'

RSpec.describe RolePermission do
  describe 'associations' do
    it { is_expected.to belong_to(:role) }
    it { is_expected.to belong_to(:permission) }
  end

  describe 'composite primary key' do
    it 'uses [role_id, permission_id] as primary key' do
      expect(described_class.primary_key).to eq([ "role_id", "permission_id" ])
    end
  end
end
