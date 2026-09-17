using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

internal static class BrowserLauncher
{
    private const string Url = "http://127.0.0.1:5173/";
    private static bool IsReady()
    {
        try
        {
            var request = (HttpWebRequest)WebRequest.Create(Url + "api/health");
            request.Timeout = 800;
            request.Proxy = null;
            using (var response = request.GetResponse())
            using (var reader = new StreamReader(response.GetResponseStream()))
                return reader.ReadToEnd().Contains("\"app\":\"zhiling\"");
        }
        catch { return false; }
    }

    [STAThread]
    private static void Main()
    {
        var root = AppDomain.CurrentDomain.BaseDirectory;
        try
        {
            using (var mutex = new Mutex(false, "Local\\ZhilingBrowserLauncher"))
            {
                if (!mutex.WaitOne(20000)) throw new Exception("织灵正在启动，请稍后再试。");
                try
                {
                    if (!IsReady())
                    {
                        var node = Path.Combine(root, "runtime", "node.exe");
                        var server = Path.Combine(root, "server", "start.cjs");
                        if (!File.Exists(node) || !File.Exists(server))
                            throw new Exception("找不到随附的运行环境，请保留完整的织灵程序目录。");
                        var info = new ProcessStartInfo(node, "\"" + server + "\"");
                        info.WorkingDirectory = root;
                        info.UseShellExecute = false;
                        info.CreateNoWindow = true;
                        info.WindowStyle = ProcessWindowStyle.Hidden;
                        info.EnvironmentVariables["ZHILING_PORT"] = "5173";
                        info.EnvironmentVariables["ZHILING_DATA_DIR"] = Path.Combine(root, "data");
                        var process = Process.Start(info);
                        var deadline = DateTime.UtcNow.AddSeconds(15);
                        while (!IsReady())
                        {
                            if (process.HasExited || DateTime.UtcNow > deadline)
                                throw new Exception("本地服务未能启动，可能有其他程序占用了 5173 端口。请关闭旧版开发服务后重试。");
                            Thread.Sleep(150);
                        }
                    }
                }
                finally { mutex.ReleaseMutex(); }
            }
            Process.Start(new ProcessStartInfo(Url) { UseShellExecute = true });
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message, "织灵启动提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}
