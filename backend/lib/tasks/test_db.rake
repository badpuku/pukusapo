# Supabase 固有のスキーマをテスト用DBに作成する
# db/schema.rb に含まれる extensions.*, graphql.*, vault.* の enable_extension が
# 素の PostgreSQL では失敗するため、事前にスキーマだけ作成しておく
namespace :db do
  namespace :test do
    task create_supabase_schemas: :environment do
      next unless Rails.env.test?

      ActiveRecord::Base.connection.execute(<<~SQL)
        CREATE SCHEMA IF NOT EXISTS extensions;
        CREATE SCHEMA IF NOT EXISTS graphql;
        CREATE SCHEMA IF NOT EXISTS vault;
      SQL
    end
  end
end

Rake::Task["db:schema:load"].enhance(["db:test:create_supabase_schemas"])
