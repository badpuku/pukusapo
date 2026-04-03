require 'rails_helper'

RSpec.describe Permission do
  describe 'associations' do
    it { is_expected.to have_many(:role_permissions).dependent(:destroy) }
    it { is_expected.to have_many(:roles).through(:role_permissions) }
  end
end
