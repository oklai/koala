require 'rbconfig'
require 'thread'
require 'set'
require 'fileutils'

module Listen
  class Adapter
    attr_accessor :directories, :latency, :paused

    # The default delay between checking for changes.
    DEFAULT_LATENCY = 0.25

    # The default warning message when falling back to polling adapter.
    POLLING_FALLBACK_MESSAGE = "WARNING: Listen has fallen back to polling, learn more at https://github.com/guard/listen#fallback."

    # Selects the appropriate adapter implementation for the
    # current OS and initializes it.
    #
    # @param [String, Array<String>] directories the directories to watch
    # @param [Hash] options the adapter options
    # @option options [Boolean] force_polling to force polling or not
    # @option options [String, Boolean] polling_fallback_message to change polling fallback message or remove it
    # @option options [Float] latency the delay between checking for changes in seconds
    #
    # @yield [changed_dirs, options] callback Callback called when a change happens
    # @yieldparam [Array<String>] changed_dirs the changed directories
    # @yieldparam [Hash] options callback options (like :recursive => true)
    #
    # @return [Listen::Adapter] the chosen adapter
    #
    def self.select_and_initialize(directories, options = {}, &callback)
      return Adapters::Polling.new(directories, options, &callback) if options.delete(:force_polling)

      if Adapters::Darwin.usable_and_works?(directories, options)
        Adapters::Darwin.new(directories, options, &callback)
      elsif Adapters::Linux.usable_and_works?(directories, options)
        Adapters::Linux.new(directories, options, &callback)
      elsif Adapters::Windows.usable_and_works?(directories, options)
        Adapters::Windows.new(directories, options, &callback)
      else
        unless options[:polling_fallback_message] == false
          Kernel.warn(options[:polling_fallback_message] || POLLING_FALLBACK_MESSAGE)
        end
        Adapters::Polling.new(directories, options, &callback)
      end
    end

    # Initializes the adapter.
    #
    # @param [String, Array<String>] directories the directories to watch
    # @param [Hash] options the adapter options
    # @option options [Float] latency the delay between checking for changes in seconds
    #
    # @yield [changed_dirs, options] callback Callback called when a change happens
    # @yieldparam [Array<String>] changed_dirs the changed directories
    # @yieldparam [Hash] options callback options (like :recursive => true)
    #
    # @return [Listen::Adapter] the adapter
    #
    def initialize(directories, options = {}, &callback)
      @directories  = Array(directories)
      @callback     = callback
      @latency    ||= DEFAULT_LATENCY
      @latency      = options[:latency] if options[:latency]
      @paused       = false
      @mutex        = Mutex.new
      @changed_dirs = Set.new
      @turnstile    = Turnstile.new
    end

    # Starts the adapter.
    #
    # @param [Boolean] blocking whether or not to block the current thread after starting
    #
    def start(blocking = true)
      @stop = false
    end

    # Stops the adapter.
    #
    def stop
      @stop = true
      @turnstile.signal # ensure no thread is blocked
    end

    # Returns whether the adapter is statred or not
    #
    # @return [Boolean] whether the adapter is started or not
    #
    def started?
      @stop.nil? ? false : !@stop
    end

    # Blocks the main thread until the poll thread
    # calls the callback.
    #
    def wait_for_callback
      @turnstile.wait unless @paused
    end

    # Checks if the adapter is usable and works on the current OS.
    #
    # @param [String, Array<String>] directories the directories to watch
    # @param [Hash] options the adapter options
    # @option options [Float] latency the delay between checking for changes in seconds
    #
    # @return [Boolean] whether usable and work or not
    #
    def self.usable_and_works?(directories, options = {})
      usable? && Array(directories).all? { |d| works?(d, options) }
    end

    # Runs a tests to determine if the adapter can actually pick up
    # changes in a given directory and returns the result.
    #
    # @note This test takes some time depending the adapter latency.
    #
    # @param [String, Pathname] directory the directory to watch
    # @param [Hash] options the adapter options
    # @option options [Float] latency the delay between checking for changes in seconds
    #
    # @return [Boolean] whether the adapter works or not
    #
    def self.works?(directory, options = {})
      work = false
      test_file = "#{directory}/.listen_test"
      callback = lambda { |changed_dirs, options| work = true }
      adapter  = self.new(directory, options, &callback)
      adapter.start(false)

      FileUtils.touch(test_file)

      t = Thread.new { sleep(adapter.latency * 5); adapter.stop }

      adapter.wait_for_callback
      work
    ensure
      Thread.kill(t) if t
      FileUtils.rm(test_file) if File.exists?(test_file)
      adapter.stop if adapter && adapter.started?
    end

    private

    # Polls changed directories and reports them back
    # when there are changes.
    #
    # @option [Boolean] recursive whether or not to pass the recursive option to the callback
    #
    def poll_changed_dirs(recursive = false)
      until @stop
        sleep(@latency)
        next if @changed_dirs.empty?

        changed_dirs = []

        @mutex.synchronize do
          changed_dirs = @changed_dirs.to_a
          @changed_dirs.clear
        end

        @callback.call(changed_dirs, recursive ? {:recursive => recursive} : {})
        @turnstile.signal
      end
    end
  end
end
