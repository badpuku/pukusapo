require 'rails_helper'

RSpec.describe Profile do
  describe 'associations' do
    it { is_expected.to belong_to(:role) }
  end

  describe 'delegation' do
    it { is_expected.to delegate_method(:permission_level).to(:role) }
  end

  describe '#moderator?' do
    context 'when permission_level is less than 5' do
      it 'returns false' do
        profile = build(:profile, role: build(:role, permission_level: 4))
        expect(profile.moderator?).to be false
      end
    end

    context 'when permission_level is exactly 5' do
      it 'returns true' do
        profile = build(:profile, role: build(:role, permission_level: 5))
        expect(profile.moderator?).to be true
      end
    end

    context 'when permission_level is greater than 5' do
      it 'returns true' do
        profile = build(:profile, role: build(:role, permission_level: 6))
        expect(profile.moderator?).to be true
      end
    end
  end

  describe '#admin?' do
    context 'when permission_level is less than 10' do
      it 'returns false' do
        profile = build(:profile, role: build(:role, permission_level: 9))
        expect(profile.admin?).to be false
      end
    end

    context 'when permission_level is exactly 10' do
      it 'returns true' do
        profile = build(:profile, role: build(:role, permission_level: 10))
        expect(profile.admin?).to be true
      end
    end

    context 'when permission_level is greater than 10' do
      it 'returns true' do
        profile = build(:profile, role: build(:role, permission_level: 11))
        expect(profile.admin?).to be true
      end
    end
  end
end
