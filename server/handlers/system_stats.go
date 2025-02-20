package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/dan0102dan/kvas-wui/utils"
)

// SystemStats — итоговая структура, которую вернём в JSON
type SystemStats struct {
	CPU        CPUStats     `json:"cpu"`
	Memory     MemoryStats  `json:"memory"`
	Network    NetworkStats `json:"network"`
	Filesystem FSStats      `json:"filesystem"`
}

// CPUStats описывает информацию о CPU
type CPUStats struct {
	Usage     float64    `json:"usage"` // Итоговый % загрузки CPU
	Sys       float64    `json:"sys"`
	User      float64    `json:"user"`
	Iowait    float64    `json:"iowait"`
	Steal     float64    `json:"steal"`
	Cores     int        `json:"cores"`
	Idle      float64    `json:"idle"`
	UptimeSec uint64     `json:"uptimeSec"` // аптайм в секундах
	Load      [3]float64 `json:"load"`      // Load average за 1, 5, 15 минут
}

// MemoryStats описывает информацию о памяти
type MemoryStats struct {
	Free      int `json:"free"`      // в МБ
	Used      int `json:"used"`      // в МБ
	PageCache int `json:"pageCache"` // в МБ
	// Поле usage убрано – его можно вычислить на клиенте
}

// NetworkStats описывает информацию о сети
type NetworkStats struct {
	RxSpeedBps float64 `json:"rxSpeedBps"` // скорость приема в байтах/с
	TxSpeedBps float64 `json:"txSpeedBps"` // скорость передачи в байтах/с
	RxTotal    uint64  `json:"rxTotal"`    // общее количество принятых байт
	TxTotal    uint64  `json:"txTotal"`    // общее количество переданных байт
	Retrans    int     `json:"retrans"`
	Active     int     `json:"active"`
	Passive    int     `json:"passive"`
	Fails      int     `json:"fails"`
	Interfaces int     `json:"interfaces"`
}

// FSStats описывает информацию о файловой системе
type FSStats struct {
	Name  string `json:"name"`
	Used  int    `json:"used"`  // в МБ
	Total int    `json:"total"` // в МБ
}

// Состояние для вычисления RxSpeed/TxSpeed между вызовами
var netState struct {
	lastRx   uint64
	lastTx   uint64
	lastTime time.Time
	inited   bool
	mu       sync.Mutex
}

// SystemStatsHandler — основной эндпоинт, который возвращает JSON со статистикой.
func SystemStatsHandler(w http.ResponseWriter, r *http.Request) {
	stats, err := getSystemStats()
	if err != nil {
		http.Error(w, "Failed to get system stats: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		log.Printf("JSON encode error: %v", err)
	}
}

// getSystemStats собирает статистику без лишних преобразований.
func getSystemStats() (*SystemStats, error) {
	stats := &SystemStats{}

	// 1. Собираем CPU usage через /proc/stat
	if err := fillCPUStats(stats); err != nil {
		return nil, err
	}

	// 2. Память через /proc/meminfo
	if err := fillMemStats(stats); err != nil {
		return nil, err
	}

	// 3. Load average через /proc/loadavg
	if err := fillLoadAvg(stats); err != nil {
		return nil, err
	}

	// 4. Uptime (аптайм) через /proc/uptime
	if err := fillUptime(stats); err != nil {
		return nil, err
	}

	// 5. Файловая система: df -m /
	if err := fillFSStats(stats); err != nil {
		return nil, err
	}

	// 6. Сеть (включая расчет скорости) через /proc/net/dev
	if err := fillNetDev(stats); err != nil {
		return nil, err
	}

	// Дополнительные поля, если необходимо
	stats.Network.Retrans = 0
	stats.Network.Active = 0
	stats.Network.Passive = 0
	stats.Network.Fails = 0

	return stats, nil
}

func fillCPUStats(stats *SystemStats) error {
	line1, err := readCPUStat()
	if err != nil {
		return err
	}
	time.Sleep(200 * time.Millisecond)
	line2, err := readCPUStat()
	if err != nil {
		return err
	}

	u1, n1, s1, i1, w1, irq1, sirq1, st1 := parseCPUFields(line1)
	u2, n2, s2, i2, w2, irq2, sirq2, st2 := parseCPUFields(line2)

	idleDelta := float64((i2 - i1) + (w2 - w1))
	totalDelta := float64(
		(u2 - u1) + (n2 - n1) + (s2 - s1) +
			(irq2 - irq1) + (sirq2 - sirq1) + (st2 - st1) +
			(i2 - i1) + (w2 - w1),
	)
	if totalDelta <= 0 {
		return nil
	}

	stats.CPU.Usage = 100.0 * (totalDelta - idleDelta) / totalDelta
	stats.CPU.User = 100.0 * float64((u2-u1)+(n2-n1)) / totalDelta
	stats.CPU.Sys = 100.0 * float64((s2-s1)+(irq2-irq1)+(sirq2-sirq1)) / totalDelta
	stats.CPU.Iowait = 100.0 * float64(w2-w1) / totalDelta
	stats.CPU.Steal = 100.0 * float64(st2-st1) / totalDelta
	stats.CPU.Idle = 100.0 * idleDelta / totalDelta

	// Узнаём количество ядер
	coreCountOutput, err := utils.ExecuteCommand("grep -c '^processor' /proc/cpuinfo")
	if err == nil {
		c, _ := strconv.Atoi(strings.TrimSpace(coreCountOutput))
		if c < 1 {
			c = 1
		}
		stats.CPU.Cores = c
	} else {
		stats.CPU.Cores = 1
	}

	return nil
}

func readCPUStat() (string, error) {
	data, err := ioutil.ReadFile("/proc/stat")
	if err != nil {
		return "", err
	}
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "cpu ") {
			return line, nil
		}
	}
	return "", fmt.Errorf("no 'cpu ' line found in /proc/stat")
}

func parseCPUFields(line string) (user, nice, system, idle, iowait, irq, sirq, steal uint64) {
	fields := strings.Fields(line)
	if len(fields) >= 8 {
		user, _ = strconv.ParseUint(fields[1], 10, 64)
		nice, _ = strconv.ParseUint(fields[2], 10, 64)
		system, _ = strconv.ParseUint(fields[3], 10, 64)
		idle, _ = strconv.ParseUint(fields[4], 10, 64)
		iowait, _ = strconv.ParseUint(fields[5], 10, 64)
		irq, _ = strconv.ParseUint(fields[6], 10, 64)
		sirq, _ = strconv.ParseUint(fields[7], 10, 64)
	}
	if len(fields) >= 9 {
		steal, _ = strconv.ParseUint(fields[8], 10, 64)
	}
	return
}

func fillMemStats(stats *SystemStats) error {
	data, err := ioutil.ReadFile("/proc/meminfo")
	if err != nil {
		return err
	}
	var memTotal, memFree, buffers, cached uint64

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		switch {
		case strings.HasPrefix(line, "MemTotal:"):
			memTotal, _ = parseMeminfoLine(line)
		case strings.HasPrefix(line, "MemFree:"):
			memFree, _ = parseMeminfoLine(line)
		case strings.HasPrefix(line, "Buffers:"):
			buffers, _ = parseMeminfoLine(line)
		case strings.HasPrefix(line, "Cached:"):
			cached, _ = parseMeminfoLine(line)
		}
	}
	used := memTotal - (memFree + buffers + cached)
	stats.Memory.Free = int(memFree / 1024)
	stats.Memory.Used = int(used / 1024)
	stats.Memory.PageCache = int((buffers + cached) / 1024)
	// Убираем вычисление процента использования памяти
	return nil
}

func parseMeminfoLine(line string) (value uint64, unit string) {
	fields := strings.Fields(line)
	if len(fields) < 3 {
		return 0, ""
	}
	v, _ := strconv.ParseUint(fields[1], 10, 64)
	return v, fields[2]
}

func fillLoadAvg(stats *SystemStats) error {
	data, err := ioutil.ReadFile("/proc/loadavg")
	if err != nil {
		return err
	}
	fields := strings.Fields(string(data))
	if len(fields) < 3 {
		return fmt.Errorf("invalid format in /proc/loadavg")
	}
	la1, _ := strconv.ParseFloat(fields[0], 64)
	la5, _ := strconv.ParseFloat(fields[1], 64)
	la15, _ := strconv.ParseFloat(fields[2], 64)
	stats.CPU.Load = [3]float64{la1, la5, la15}
	return nil
}

func fillUptime(stats *SystemStats) error {
	data, err := ioutil.ReadFile("/proc/uptime")
	if err != nil {
		return err
	}
	fields := strings.Fields(string(data))
	if len(fields) < 1 {
		return fmt.Errorf("invalid format in /proc/uptime")
	}
	seconds, _ := strconv.ParseFloat(fields[0], 64)
	stats.CPU.UptimeSec = uint64(seconds)
	return nil
}

func fillFSStats(stats *SystemStats) error {
	out, err := utils.ExecuteCommand("df -m /")
	if err != nil {
		return err
	}
	lines := strings.Split(out, "\n")
	if len(lines) < 2 {
		return nil
	}
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "Filesystem") || line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 6 {
			continue
		}
		stats.Filesystem.Name = fields[0]
		total, _ := strconv.Atoi(fields[1])
		used, _ := strconv.Atoi(fields[2])
		stats.Filesystem.Total = total
		stats.Filesystem.Used = used
		break
	}
	return nil
}

func fillNetDev(stats *SystemStats) error {
	data, err := ioutil.ReadFile("/proc/net/dev")
	if err != nil {
		return err
	}
	lines := strings.Split(string(data), "\n")

	var totalRx, totalTx uint64
	var ifaceCount int

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "Inter-") || strings.HasPrefix(line, "face") {
			continue
		}
		ifaceCount++

		parts := strings.Split(line, ":")
		if len(parts) < 2 {
			continue
		}
		statsStr := strings.Fields(parts[1])
		if len(statsStr) < 9 {
			continue
		}
		rxBytes, _ := strconv.ParseUint(statsStr[0], 10, 64)
		txBytes, _ := strconv.ParseUint(statsStr[8], 10, 64)
		totalRx += rxBytes
		totalTx += txBytes
	}
	stats.Network.Interfaces = ifaceCount

	netState.mu.Lock()
	defer netState.mu.Unlock()

	now := time.Now()
	if netState.inited {
		dt := now.Sub(netState.lastTime).Seconds()
		if dt > 0 {
			rxDelta := totalRx - netState.lastRx
			txDelta := totalTx - netState.lastTx

			stats.Network.RxSpeedBps = float64(rxDelta) / dt
			stats.Network.TxSpeedBps = float64(txDelta) / dt
		} else {
			stats.Network.RxSpeedBps = 0
			stats.Network.TxSpeedBps = 0
		}
	} else {
		netState.inited = true
		stats.Network.RxSpeedBps = 0
		stats.Network.TxSpeedBps = 0
	}

	netState.lastRx = totalRx
	netState.lastTx = totalTx
	netState.lastTime = now

	stats.Network.RxTotal = totalRx
	stats.Network.TxTotal = totalTx

	return nil
}
