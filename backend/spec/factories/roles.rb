FactoryBot.define do
  factory :role do
    sequence(:code) { |n| "role_#{n}" }
    sequence(:name) { |n| "Role #{n}" }
    permission_level { 1 }
    is_active { true }

    trait :admin do
      code { "admin" }
      name { "管理者" }
      permission_level { 10 }
    end

    trait :moderator do
      code { "moderator" }
      name { "モデレーター" }
      permission_level { 5 }
    end

    trait :user do
      code { "user" }
      name { "一般ユーザー" }
      permission_level { 1 }
    end
  end
end
