# ==============================================================================
# TORQWASH PRO - Automated Supabase Migration Runner & Verification Script
# ==============================================================================
require "net/http"
require "uri"
require "json"

MIGRATION_FILE = File.expand_path("../supabase/migrations/20261006000000_create_torqwash_schema.sql", __dir__)

def run_migration
  puts "======================================================================"
  puts " TORQWASH PRO - Supabase Migration Execution & Verification"
  puts "======================================================================"

  unless File.exist?(MIGRATION_FILE)
    puts "[ERROR] Migration file not found at: #{MIGRATION_FILE}"
    exit 1
  end

  sql_content = File.read(MIGRATION_FILE)
  puts "[INFO] Loaded migration script: #{MIGRATION_FILE}"
  puts "[INFO] SQL Size: #{sql_content.bytesize} bytes"

  db_url = ENV["DATABASE_URL"] || ENV["SUPABASE_DB_URL"]
  api_token = ENV["SUPABASE_ACCESS_TOKEN"]
  project_ref = ENV["SUPABASE_PROJECT_REF"]

  if db_url
    puts "[INFO] Connecting via Direct Postgres Connection String..."
    # Execute via psql if available
    cmd = %Q{psql "#{db_url}" -f "#{MIGRATION_FILE}"}
    system(cmd)
  elsif api_token && project_ref
    puts "[INFO] Executing via Supabase Management API for project #{project_ref}..."
    uri = URI("https://api.supabase.com/v1/projects/#{project_ref}/database/query")
    req = Net::HTTP::Post.new(uri)
    req["Authorization"] = "Bearer #{api_token}"
    req["Content-Type"] = "application/json"
    req.body = { query: sql_content }.to_json

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(req)
    end

    if res.code.to_i == 200 || res.code.to_i == 201
      puts "[SUCCESS] Migration executed successfully via Supabase Management API!"
    else
      puts "[ERROR] Supabase API responded with code #{res.code}: #{res.body}"
    end
  else
    puts "[NOTICE] No direct DATABASE_URL or SUPABASE_ACCESS_TOKEN provided in environment."
    puts "[NOTICE] You can run this migration with either:"
    puts "  1. DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres\" ruby scripts/migrate.rb"
    puts "  2. Or copy the SQL script from supabase/migrations/20261006000000_create_torqwash_schema.sql into your Supabase SQL Editor and click RUN."
  end
end

if __FILE__ == $0
  run_migration
end
