# Supabase 固有の extension を素の PostgreSQL でスキップする
#
# db/schema.rb には Supabase が管理する extension（extensions.*, graphql.*, vault.*）が含まれる。
# これらは素の PostgreSQL にはインストールできないため、テスト環境では enable_extension を
# 安全にスキップする。
#
# Rails アプリのランタイムコードはこれらの extension に依存していないため、
# スキップしてもテストの正確性に影響はない。

SUPABASE_EXTENSION_PREFIXES = %w[extensions. graphql. vault.].freeze

if Rails.env.test?
  require "active_record/connection_adapters/postgresql_adapter"

  ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.prepend(Module.new do
    def enable_extension(name)
      if SUPABASE_EXTENSION_PREFIXES.any? { |prefix| name.start_with?(prefix) }
        say "Skipping Supabase extension: #{name}"
        return
      end
      super
    end
  end)
end
