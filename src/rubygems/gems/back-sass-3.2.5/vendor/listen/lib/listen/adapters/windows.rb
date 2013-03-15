require 'set'

module Listen
  module Adapters

    # Adapter implementation for Windows `fchange`.
    #
    class Windows < Adapter

      # Initializes the Adapter. See {Listen::Adapter#initialize} for more info.
      #
      def initialize(directories, options = {}, &callback)
        super
        @worker = init_worker
      end

      # Starts the adapter.
      #
      # @param [Boolean] blocking whether or not to block the current thread after starting
      #
      def start(blocking = true)
        @mutex.synchronize do
          return if @stop == false
          super
        end

        @worker_thread = Thread.new { @worker.run }
        @poll_thread   = Thread.new { poll_changed_dirs(true) }
        @poll_thread.join if blocking
      end

      # Stops the adapter.
      #
      def stop
        @mutex.synchronize do
          return if @stop == true
          super
        end

        @worker.stop
        Thread.kill(@worker_thread) if @worker_thread
        @poll_thread.join
      end

      # Checks if the adapter is usable on the current OS.
      #
      # @return [Boolean] whether usable or not
      #
      def self.usable?
        return false unless RbConfig::CONFIG['target_os'] =~ /mswin|mingw/i

        require 'rb-fchange'
        true
      rescue LoadError
        false
      end

    private

      # Initializes a FChange worker and adds a watcher for
      # each directory passed to the adapter.
      #
      # @return [FChange::Notifier] initialized worker
      #
      def init_worker
        FChange::Notifier.new.tap do |worker|
          @directories.each do |directory|
            worker.watch(directory, :all_events, :recursive) do |event|
              next if @paused
              @mutex.synchronize do
                @changed_dirs << File.expand_path(event.watcher.path)
              end
            end
          end
        end
      end

    end

  end
end
