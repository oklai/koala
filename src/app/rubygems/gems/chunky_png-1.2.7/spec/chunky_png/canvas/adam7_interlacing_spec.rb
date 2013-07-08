require 'spec_helper'

describe ChunkyPNG::Canvas::Adam7Interlacing do
  include ChunkyPNG::Canvas::Adam7Interlacing

  describe '#adam7_pass_sizes' do
    it "should get the pass sizes for a 8x8 image correctly" do
      adam7_pass_sizes(8, 8).should == [
          [1, 1], [1, 1], [2, 1], [2, 2], [4, 2], [4, 4], [8, 4]
        ]
    end

    it "should get the pass sizes for a 12x12 image correctly" do
      adam7_pass_sizes(12, 12).should == [
          [2, 2], [1, 2], [3, 1], [3, 3], [6, 3], [6, 6], [12, 6]
        ]
    end

    it "should get the pass sizes for a 33x47 image correctly" do
      adam7_pass_sizes(33, 47).should == [
          [5, 6], [4, 6], [9, 6], [8, 12], [17, 12], [16, 24], [33, 23]
        ]
    end

    it "should get the pass sizes for a 1x1 image correctly" do
      adam7_pass_sizes(1, 1).should == [
          [1, 1], [0, 1], [1, 0], [0, 1], [1, 0], [0, 1], [1, 0]
        ]
    end

    it "should get the pass sizes for a 0x0 image correctly" do
      adam7_pass_sizes(0, 0).should == [
          [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]
        ]
    end

    it "should always maintain the same amount of pixels in total" do
      [[8, 8], [12, 12], [33, 47], [1, 1], [0, 0]].each do |(width, height)|
        pass_sizes = adam7_pass_sizes(width, height)
        pass_sizes.inject(0) { |sum, (w, h)| sum + (w*h) }.should == width * height
      end
    end
  end

  describe '#adam7_multiplier_offset' do
    it "should get the multiplier and offset values for pass 1 correctly" do
      adam7_multiplier_offset(0).should == [3, 0, 3, 0]
    end
    
    it "should get the multiplier and offset values for pass 2 correctly" do
      adam7_multiplier_offset(1).should == [3, 4, 3, 0]
    end
    
    it "should get the multiplier and offset values for pass 3 correctly" do
      adam7_multiplier_offset(2).should == [2, 0, 3, 4]
    end
    
    it "should get the multiplier and offset values for pass 4 correctly" do
      adam7_multiplier_offset(3).should == [2, 2, 2, 0]
    end
    
    it "should get the multiplier and offset values for pass 5 correctly" do
      adam7_multiplier_offset(4).should == [1, 0, 2, 2]
    end

    it "should get the multiplier and offset values for pass 6 correctly" do
      adam7_multiplier_offset(5).should == [1, 1, 1, 0]
    end
    
    it "should get the multiplier and offset values for pass 7 correctly" do
      adam7_multiplier_offset(6).should == [0, 0, 1, 1]
    end
  end

  describe '#adam7_merge_pass' do
    it "should merge the submatrices correctly" do
      submatrices = [
        ChunkyPNG::Canvas.new(1, 1,  168430335), # r = 10
        ChunkyPNG::Canvas.new(1, 1,  336860415), # r = 20
        ChunkyPNG::Canvas.new(2, 1,  505290495), # r = 30
        ChunkyPNG::Canvas.new(2, 2,  677668095), # r = 40
        ChunkyPNG::Canvas.new(4, 2,  838912255), # r = 50
        ChunkyPNG::Canvas.new(4, 4, 1023344895), # r = 60
        ChunkyPNG::Canvas.new(8, 4, 1175063295), # r = 70
      ]
      
      canvas = ChunkyPNG::Image.new(8,8)
      submatrices.each_with_index { |m, pass| adam7_merge_pass(pass, canvas, m) }
      canvas.should == reference_image('adam7')
    end
  end

  describe '#adam7_extract_pass' do
    before(:each) { @canvas = reference_canvas('adam7') }

    1.upto(7) do |pass|
      it "should extract pass #{pass} correctly" do
        sm = adam7_extract_pass(pass - 1, @canvas)
        sm.pixels.length.should == sm.width * sm.height
        sm.pixels.uniq.length.should == 1
        ChunkyPNG::Color.r(sm[0,0]).should == pass * 10
      end
    end
  end

end