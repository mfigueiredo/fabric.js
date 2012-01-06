using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using SharpKit.JavaScript;
using SharpKit.Html4;
using SharpKit.jQuery;

namespace Physics
{
    public partial class Default : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }
    }

    [JsType(JsMode.Global, Filename = "res/Default.js")]
    public class DefaultClient : jQueryContext
    {
        static void DefaultClient_Load()
        {
            var btn = J("button");
            btn.hide();
            btn.fadeIn(1000);
        }
        static void btnTest_click(HtmlDomEventArgs e)
        {
            J(document.body).append("Hello world<br/>");
        }
    }

}