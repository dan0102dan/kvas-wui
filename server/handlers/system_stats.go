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
	CPU        CPUStats      `json:"cpu"`
	Memory     MemoryStats   `json:"memory"`
	Network    NetworkStats  `json:"network"`
	Filesystem FSStats       `json:"filesystem"`
}

// CPUStats описывает информацию о CPU
type CPUStats struct {
	Usage  float64    `json:"usage"`  // Итоговый % загрузки CPU
	Sys    float64    `json:"sys"`
	User   float64    `json:"user"`
	Iowait float64    `json:"iowait"`
	Steal  float64    `json:"steal"`
	Cores  int        `json:"cores"`
	Idle   float64    `json:"idle"`
	Uptime string     `json:"uptime"` // Человекочитаемый аптайм: "6d", "2h10m" и т.д.
	Load   [3]float64 `json:"load"`   // Load average за 1, 5, 15 минут
}

// MemoryStats описывает информацию о памяти
type MemoryStats struct {
	Free      int `json:"free"`      // в МБ
	Used      int `json:"used"`      // в МБ
	PageCache int `json:"pageCache"` // в МБ (Buffers + Cached)
	Usage     int `json:"usage"`     // % использования
}

// NetworkStats описывает информацию о сети
type NetworkStats struct {
	RxSpeed    string `json:"rxSpeed"` // например, "123 K/s", "1.2 M/s" и т.д.
	TxSpeed    string `json:"txSpeed"`
	RxTotal    string `json:"rxTotal"`
	TxTotal    string `json:"txTotal"`
	Retrans    int    `json:"retrans"`
	Active     int    `json:"active"`
	Passive    int    `json:"passive"`
	Fails      int    `json:"fails"`
	Interfaces int    `json:"interfaces"`
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

// getSystemStats собирает статистику без «придуманных» значений.
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

	// При необходимости здесь же можно вычитать дополнительные поля.
	stats.Network.Retrans = 0  // Пример: если у вас есть логи retrans
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
	stats.CPU.User = 100.0 * float64((u2 - u1)+(n2 - n1)) / totalDelta
	stats.CPU.Sys = 100.0 * float64((s2 - s1)+(irq2 - irq1)+(sirq2 - sirq1)) / totalDelta
	stats.CPU.Iowait = 100.0 * float64(w2 - w1) / totalDelta
	stats.CPU.Steal = 100.0 * float64(st2 - st1) / totalDelta
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

// Пример строки: "cpu  22573 54 9812 129876 140 0 37 0 12"
func parseCPUFields(line string) (user, nice, system, idle, iowait, irq, sirq, steal uint64) {
	fields := strings.Fields(line)
	// fields[0] = "cpu"
	// fields[1] = user
	// fields[2] = nice
	// fields[3] = system
	// fields[4] = idle
	// fields[5] = iowait
	// fields[6] = irq
	// fields[7] = softirq
	// fields[8] = steal (если есть)
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

	if memTotal > 0 {
		stats.Memory.Usage = int(float64(used) * 100.0 / float64(memTotal))
	}
	return nil
}

func parseMeminfoLine(line string) (value uint64, unit string) {
	fields := strings.Fields(line)
	if len(fields) < 3 {
		return 0, ""
	}
	v, _ := strconv.ParseUint(fields[1], 10, 64)
	return v, fields[2] // Обычно "kB"
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
	stats.CPU.Uptime = formatUptime(uint64(seconds))
	return nil
}

// formatUptime переводит секунды в строку формата "1d2h30m"
func formatUptime(sec uint64) string {
	days := sec / 86400
	hours := (sec % 86400) / 3600
	mins := (sec % 3600) / 60

	var parts []string
	if days > 0 {
		parts = append(parts, fmt.Sprintf("%dd", days))
	}
	if hours > 0 {
		parts = append(parts, fmt.Sprintf("%dh", hours))
	}
	if mins > 0 {
		parts = append(parts, fmt.Sprintf("%dm", mins))
	}
	if len(parts) == 0 {
		parts = append(parts, "0m")
	}
	return strings.Join(parts, "")
}

// fillFSStats заполняет сведения о ФС, используя df -m / (или /overlay, если нужно)
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

// fillNetDev парсит /proc/net/dev, чтобы получить суммарные Rx/Tx байты, вычисляет скорость,
// а также считает количество интерфейсов.
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

	// Преобразуем в МБ или ГБ "всего" (RxTotal, TxTotal).
	stats.Network.RxTotal = formatBytes(totalRx)
	stats.Network.TxTotal = formatBytes(totalTx)

	// Вычисление скорости: разница текущих байтов с предыдущим замером
	netState.mu.Lock()
	defer netState.mu.Unlock()

	now := time.Now()
	if netState.inited {
		dt := now.Sub(netState.lastTime).Seconds()
		if dt > 0 {
			rxDelta := totalRx - netState.lastRx
			txDelta := totalTx - netState.lastTx

			// байт/с
			rxSpeedBps := float64(rxDelta) / dt
			txSpeedBps := float64(txDelta) / dt

			// Преобразуем в человекочитаемый вид: "123 K/s"
			stats.Network.RxSpeed = formatSpeed(rxSpeedBps)
			stats.Network.TxSpeed = formatSpeed(txSpeedBps)
		} else {
			// Если dt == 0, скорость считать нельзя
			stats.Network.RxSpeed = "0 B/s"
			stats.Network.TxSpeed = "0 B/s"
		}
	} else {
		// Первый вызов — пока не можем считать скорость, т.к. нет предыдущей точки
		netState.inited = true
		stats.Network.RxSpeed = "0 B/s"
		stats.Network.TxSpeed = "0 B/s"
	}

	// Обновляем "предыдущее" состояние
	netState.lastRx = totalRx
	netState.lastTx = totalTx
	netState.lastTime = now

	return nil
}

// formatBytes преобразует общее количество байт в удобочитаемый формат: "12.3 M" или "1.2 G"
func formatBytes(b uint64) string {
	const kb = 1024
	const mb = 1024 * 1024
	const gb = 1024 * 1024 * 1024

	switch {
	case b >= gb:
		return fmt.Sprintf("%.1f G", float64(b)/float64(gb))
	case b >= mb:
		return fmt.Sprintf("%.1f M", float64(b)/float64(mb))
	case b >= kb:
		return fmt.Sprintf("%.1f K", float64(b)/float64(kb))
	default:
		return fmt.Sprintf("%d B", b)
	}
}

// formatSpeed преобразует скорость (байт/сек) в строку вида "123 K/s", "1.2 M/s" и т.д.
func formatSpeed(bps float64) string {
	// bps = байт/сек
	const kb = 1024
	const mb = 1024 * 1024
	const gb = 1024 * 1024 * 1024

	switch {
	case bps >= gb:
		return fmt.Sprintf("%.1f G/s", bps/gb)
	case bps >= mb:
		return fmt.Sprintf("%.1f M/s", bps/mb)
	case bps >= kb:
		return fmt.Sprintf("%.1f K/s", bps/kb)
	default:
		return fmt.Sprintf("%.0f B/s", bps)
	}
}
