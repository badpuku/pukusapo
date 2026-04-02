Clerk.configure do |c|
  if Rails.env.test?
    c.secret_key = "sk_test_dummy"
    c.publishable_key = "pk_test_dummy"
  else
    c.secret_key = ENV["CLERK_SECRET_KEY"]
    c.publishable_key = ENV["CLERK_PUBLISHABLE_KEY"]
  end

  if Rails.env.development?
    c.logger = Logger.new($stdout)
  end
end
