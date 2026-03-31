FactoryBot.define do
  factory :profile do
    sequence(:user_id) { |n| "user_#{n}" }
    sequence(:username) { |n| "testuser#{n}" }
    full_name { "テスト ユーザー" }
    avatar_url { "https://example.com/avatar.png" }
    role

    trait :admin do
      role { association :role, :admin }
    end

    trait :moderator do
      role { association :role, :moderator }
    end
  end
end
