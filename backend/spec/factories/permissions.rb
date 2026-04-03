FactoryBot.define do
  factory :permission do
    # DB: code は resource.action 形式、 (resource, action) は一意
    sequence(:resource) { |n| "res#{n}" }
    action { "read" }
    code { "#{resource}.#{action}" }
    sequence(:name) { |n| "Permission #{n}" }
    is_active { true }

    trait :profiles_read do
      resource { "profiles" }
      action { "read" }
      code { "profiles.read" }
      name { "プロフィール閲覧" }
    end
  end
end
