require 'rails_helper'

RSpec.describe Role do
  describe 'associations' do
    it { is_expected.to have_many(:profiles) }
    it { is_expected.to have_many(:role_permissions).dependent(:destroy) }
    it { is_expected.to have_many(:permissions).through(:role_permissions) }
  end
end
