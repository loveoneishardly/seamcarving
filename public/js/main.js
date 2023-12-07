const img = document.getElementById('original');
const canvas = document.getElementById('image_canvas');
const ctx = canvas.getContext('2d');

let isDrawing = false;
var maskData = []; // Lưu trữ thông tin về mask đã vẽ   

// Set canvas width and height to match the image
canvas.width = img.width;
canvas.height = img.height;

// Draw the image on the canvas
ctx.drawImage(img, 0, 0);

// Event listener for when the mouse button is pressed down
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top);
});

// Event listener for when the mouse is moved while holding the button down
canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        ctx.lineTo(e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top);
        ctx.lineWidth = 20; // Độ dày của nét vẽ
        ctx.lineCap = 'round'; // Loại đầu nét vẽ
        ctx.strokeStyle = 'red'; // Màu sắc nét vẽ
        ctx.stroke();

        // Lưu thông tin về mask đã vẽ
        maskData.push({ x: e.clientX - canvas.getBoundingClientRect().left, y: e.clientY - canvas.getBoundingClientRect().top });
    }
});

// Dừng vẽ khi chuột được nhả ra hoặc di chuyển ra khỏi canvas
canvas.addEventListener('mouseup', function() {
    isDrawing = false;
});

canvas.addEventListener('mouseout', function() {
    isDrawing = false;
});

$(document).ready(function(){
    $("#btn_seam_removal").click(function(){        
        console.log(canvas.width);
        console.log(canvas.height);
        console.log('Thực hiện seam carving dựa trên mask:', maskData);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log(imageData);
        var pixels = imageData.data;

        //for (var i = 0; i < 5; i++) {
            var energyMap = calculateEnergyMap(ctx, canvas.width, canvas.height);
            console.log(energyMap);
            //drawEnergyMap(ctx, energyMap, canvas.width, canvas.height);
            var lowEnerySeam = findLowestEnergySeam(energyMap, canvas.width, canvas.height);
            console.log(lowEnerySeam);
            //drawSeam(ctx, lowEnerySeam, canvas.width, canvas.height);

            // Loại bỏ seam từ hình ảnh
            removeSeam(ctx, lowEnerySeam, canvas.width, canvas.height);
            console.log(canvas.width);
            console.log(canvas.height);
        //}
        
    });
});


// Hàm tính gradient của từng pixel
function calculateGradient(imageData, x, y, width, height) {
    var pixelIndex = (x + y * width) * 4; // Chỉ số của pixel
    var sumX = 0;
    var sumY = 0;
  
    // Tính gradient theo chiều ngang (X)
    if (x > 0 && x < width - 1) {
      var left = pixelIndex - 4;
      var right = pixelIndex + 4;
      for (var i = 0; i < 3; i++) { // R, G, B channels
        sumX += Math.pow(imageData[left + i] - imageData[right + i], 2); // Lấy bình phương độ chênh lệch màu sắc
      }
    }
  
    // Tính gradient theo chiều dọc (Y)
    if (y > 0 && y < height - 1) {
      var up = pixelIndex - width * 4;
      var down = pixelIndex + width * 4;
      for (var j = 0; j < 3; j++) { // R, G, B channels
        sumY += Math.pow(imageData[up + j] - imageData[down + j], 2); // Lấy bình phương độ chênh lệch màu sắc
      }
    }
  
    // Tổng gradient theo cả hai chiều
    return Math.sqrt(sumX + sumY);
  }
  
  // Hàm tính bản đồ năng lượng cho hình ảnh
  function calculateEnergyMap(ctx, width, height) {
    var imageData = ctx.getImageData(0, 0, width, height).data;
    var energyMap = [];
  
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var energy = calculateGradient(imageData, x, y, width, height);
        energyMap.push(energy);
      }
    }
  
    return energyMap;
  }

//   function drawEnergyMap(ctx, energyMap, width, height) {
//     var maxEnergy = 1000; // Lấy giá trị năng lượng cao nhất
  
//     ctx.clearRect(0, 0, width, height);
  
//     for (var y = 0; y < height; y++) {
//       for (var x = 0; x < width; x++) {
//         var energy = energyMap[y * width + x];
//         var colorValue = Math.floor((energy / maxEnergy) * 255);
//         ctx.fillStyle = 'rgb(' + colorValue + ', ' + colorValue + ', ' + colorValue + ')';
//         ctx.fillRect(x, y, 1, 1); // Vẽ từng pixel với màu sắc tương ứng với năng lượng
//       }
//     }
//   }

  // Hàm tìm seam có năng lượng thấp nhất
function findLowestEnergySeam(energyMap, width, height) {
    // Tạo mảng lưu trữ năng lượng tích luỹ
    var cumulativeEnergyMap = [];
    for (var i = 0; i < width; i++) {
      cumulativeEnergyMap[i] = energyMap[i];
    }
  
    // Tính toán năng lượng tích luỹ cho từng pixel
    for (var y = 1; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var minParent = cumulativeEnergyMap[(y - 1) * width + x];
        if (x > 0) {
          minParent = Math.min(minParent, cumulativeEnergyMap[(y - 1) * width + (x - 1)]);
        }
        if (x < width - 1) {
          minParent = Math.min(minParent, cumulativeEnergyMap[(y - 1) * width + (x + 1)]);
        }
        cumulativeEnergyMap[y * width + x] = energyMap[y * width + x] + minParent;
      }
    }
  
    // Tìm pixel có năng lượng tích luỹ nhỏ nhất ở hàng cuối cùng (seam có năng lượng thấp nhất)
    var minEnergy = Number.MAX_SAFE_INTEGER;
    var minIndex = -1;
    for (var i = 0; i < width; i++) {
      if (cumulativeEnergyMap[(height - 1) * width + i] < minEnergy) {
        minEnergy = cumulativeEnergyMap[(height - 1) * width + i];
        minIndex = i;
      }
    }
  
    // Tạo mảng seam chứa các chỉ số của pixel trên seam
    var seam = [];
    for (var y = height - 1; y >= 0; y--) {
      seam[y] = minIndex;
      var currentEnergy = cumulativeEnergyMap[y * width + minIndex];
  
      // Di chuyển sang pixel trên hàng trên cùng có năng lượng tích luỹ nhỏ nhất
      if (y > 0) {
        if (minIndex > 0 && cumulativeEnergyMap[(y - 1) * width + (minIndex - 1)] === currentEnergy - energyMap[y * width + minIndex]) {
          minIndex -= 1;
        } else if (minIndex < width - 1 && cumulativeEnergyMap[(y - 1) * width + (minIndex + 1)] === currentEnergy - energyMap[y * width + minIndex]) {
          minIndex += 1;
        }
      }
    }
  
    return seam;
  }
  

//   // Hàm vẽ seam lên canvas
// function drawSeam(ctx, seam, width, height) {
//     ctx.beginPath();
//     ctx.strokeStyle = 'red';
    
//     for (var y = 0; y < height; y++) {
//       ctx.lineTo(seam[y], y);
//     }
  
//     ctx.stroke();
//   }

  // Hàm loại bỏ seam khỏi hình ảnh
  function removeSeam(ctx, seam, canvasWidth, canvasHeight) {
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var pixels = imageData.data;

    // Xóa seam khỏi ảnh
    for (var y = 0; y < canvasHeight; y++) {
        var seamX = seam[y];
        for (var x = seamX; x < canvasWidth - 1; x++) {
            var destIndex = (y * canvasWidth + x) * 4;
            var srcIndex = (y * canvasWidth + x + 1) * 4;
            pixels[destIndex] = pixels[srcIndex]; // Red channel
            pixels[destIndex + 1] = pixels[srcIndex + 1]; // Green channel
            pixels[destIndex + 2] = pixels[srcIndex + 2]; // Blue channel
            pixels[destIndex + 3] = pixels[srcIndex + 3]; // Alpha channel
        }
    }
    
    // Cập nhật kích thước canvas
    canvasWidth -= 1;
    ctx.canvas.width = canvasWidth;
    
    // Cập nhật ảnh mới sau khi xóa seam
    ctx.putImageData(imageData, 0, 0);
}
