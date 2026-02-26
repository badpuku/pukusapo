Clerk.configure do |c|
  c.secret_key = ENV["CLERK_SECRET_KEY"]
  c.publishable_key = ENV['CLERK_PUBLISHABLE_KEY']
  
  if Rails.env.development?
    c.logger = Logger.new($stdout)
  end
end