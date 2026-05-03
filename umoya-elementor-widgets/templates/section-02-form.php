<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>

<!--
=================================================================
  UMOYA FOUNDER'S CIRCLE — SECTION 02: FORM — YOUR HOMECOMING
  Layout  : 100dvh · Grid 1fr / 2fr · no overflow anywhere
  Strategy: clamp()+vh units scale all spacing proportionally.
           Right col is a flex column — card grows to fill space.
           Inside the card: 7-row grid where the textarea row
           is 1fr so it absorbs all leftover height naturally.
           No scrollbars. No overflow. Fits at every viewport ≥768px.
=================================================================
  ELEMENTOR: HTML widget directly below Section 01 (Hero).
  id="fc-form-section" is the anchor for all CTA buttons.
  MAILCHIMP: Form uses standard field names compatible with
             Mailchimp embedded form integration. Connect via
             Mailchimp's embedded form action URL + hidden fields.
=================================================================
-->

<section id="fc-form-section" aria-label="Join the Founder's Circle — Inquiry Form">

  <div class="fc-f2-outer">

    <!-- =========================================================
         LEFT — Image panel (1fr)
         Fills the full 100dvh height via position:absolute+inset:0.
         overflow:hidden clips the image to the column — structural only.
         Text is bottom-center aligned.
         ========================================================= -->
    <div class="fc-f2-img-col" aria-hidden="true">
      <img
        src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_dsc04418(1).jpg"
        alt="Umoya Afrika Tours — heritage journey"
      />
      <div class="fc-f2-img-ov"></div>
      <div class="fc-f2-img-txt">
        <span class="fc-f2-img-eye">Inquiry Form</span>
        <h2 class="fc-f2-img-ttl">Inaugural Founder's Journey</h2>
        <span class="fc-f2-img-rule"></span>
      </div>
    </div>

    <!-- =========================================================
         RIGHT — Form panel (2fr)
         Flex column. Card grows. Textarea absorbs leftover height.
         No overflow property on this column.
         ========================================================= -->
    <div class="fc-f2-form-col">
      <div class="fc-f2-inner">

        <!-- SECTION HEADER -->
        <div class="fc-f2-hd fc-f2-rv">
          <span class="fc-f2-eye">Reserve Your Place</span>
          <h2 class="fc-f2-ttl">South Africa Awaits</h2>
          <span class="fc-f2-rule" aria-hidden="true"></span>
          <p class="fc-f2-sub">Tell us about yourself and the travel experience you're seeking. A dedicated Umoya Travel Expert will personally connect with you to begin planning your experience.</p>
        </div>

        <!-- FORM CARD -->
        <div class="fc-f2-card fc-f2-rv d1">

          <!--
            ★ MAILCHIMP INTEGRATION:
            Replace the action URL and hidden fields below with your
            Mailchimp embedded form action URL and list/audience fields.
            Example:
              action="https://umoyaafrikatours.us21.list-manage.com/subscribe/post?u=XXXXX&amp;id=XXXXX"
            Add the required hidden field:
              <input type="hidden" name="u" value="YOUR_U_VALUE" />
              <input type="hidden" name="id" value="YOUR_LIST_ID" />
            The field name attributes (MERGE0–MERGE9) map to Mailchimp merge tags.
            Configure these in Mailchimp: Audience > Settings > Audience fields and *|MERGE|* tags
          -->
          <form class="fc-f2-form" id="fc2Form" method="post" novalidate aria-label="Founder's Circle Inquiry Form">

            <div class="fc-f2-fg">

              <!-- Row 1: Title | spacer -->
              <div class="fc-f2-field">
                <label for="fc2Title">Title</label>
                <select id="fc2Title" name="MERGE1">
                  <option value="" disabled selected>Select…</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>
              <div aria-hidden="true"></div>

              <!-- Row 2: First Name | Last Name -->
              <div class="fc-f2-field">
                <label for="fc2First">First Name <span class="fc-f2-req" aria-hidden="true">*</span></label>
                <input type="text" id="fc2First" name="FNAME" placeholder="First name" required autocomplete="given-name" />
              </div>
              <div class="fc-f2-field">
                <label for="fc2Last">Last Name <span class="fc-f2-req" aria-hidden="true">*</span></label>
                <input type="text" id="fc2Last" name="LNAME" placeholder="Last name" required autocomplete="family-name" />
              </div>

              <!-- Row 3: Email | Phone -->
              <div class="fc-f2-field">
                <label for="fc2Email">Email Address <span class="fc-f2-req" aria-hidden="true">*</span></label>
                <input type="email" id="fc2Email" name="EMAIL" placeholder="your@email.com" required autocomplete="email" />
              </div>
              <div class="fc-f2-field">
                <label for="fc2Phone">Phone Number</label>
                <input type="tel" id="fc2Phone" name="PHONE" placeholder="+1 (000) 000-0000" autocomplete="tel" />
              </div>

              <!-- Row 4: Country | City -->
              <div class="fc-f2-field">
                <label for="fc2Country">Country <span class="fc-f2-req" aria-hidden="true">*</span></label>
                <select id="fc2Country" name="MERGE2" required>
                  <option value="" disabled selected>Select country…</option>

                  <!-- Frequently Used Countries Pinned to Top -->
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="ZA">South Africa</option>
                  <option value="AU">Australia</option>
                  <option disabled>──────────</option>

                  <!-- Complete ISO Alphabetical List -->
                  <option value="AF">Afghanistan</option>
                  <option value="AL">Albania</option>
                  <option value="DZ">Algeria</option>
                  <option value="AS">American Samoa</option>
                  <option value="AD">Andorra</option>
                  <option value="AO">Angola</option>
                  <option value="AI">Anguilla</option>
                  <option value="AG">Antigua and Barbuda</option>
                  <option value="AR">Argentina</option>
                  <option value="AM">Armenia</option>
                  <option value="AW">Aruba</option>
                  <option value="AT">Austria</option>
                  <option value="AZ">Azerbaijan</option>
                  <option value="BS">Bahamas</option>
                  <option value="BH">Bahrain</option>
                  <option value="BD">Bangladesh</option>
                  <option value="BB">Barbados</option>
                  <option value="BY">Belarus</option>
                  <option value="BE">Belgium</option>
                  <option value="BZ">Belize</option>
                  <option value="BJ">Benin</option>
                  <option value="BM">Bermuda</option>
                  <option value="BT">Bhutan</option>
                  <option value="BO">Bolivia</option>
                  <option value="BA">Bosnia and Herzegovina</option>
                  <option value="BW">Botswana</option>
                  <option value="BR">Brazil</option>
                  <option value="BN">Brunei Darussalam</option>
                  <option value="BG">Bulgaria</option>
                  <option value="BF">Burkina Faso</option>
                  <option value="BI">Burundi</option>
                  <option value="CV">Cabo Verde</option>
                  <option value="KH">Cambodia</option>
                  <option value="CM">Cameroon</option>
                  <option value="KY">Cayman Islands</option>
                  <option value="CF">Central African Republic</option>
                  <option value="TD">Chad</option>
                  <option value="CL">Chile</option>
                  <option value="CN">China</option>
                  <option value="CO">Colombia</option>
                  <option value="KM">Comoros</option>
                  <option value="CG">Congo</option>
                  <option value="CD">Congo, Democratic Republic of the</option>
                  <option value="CR">Costa Rica</option>
                  <option value="HR">Croatia</option>
                  <option value="CU">Cuba</option>
                  <option value="CY">Cyprus</option>
                  <option value="CZ">Czechia</option>
                  <option value="DK">Denmark</option>
                  <option value="DJ">Djibouti</option>
                  <option value="DM">Dominica</option>
                  <option value="DO">Dominican Republic</option>
                  <option value="EC">Ecuador</option>
                  <option value="EG">Egypt</option>
                  <option value="SV">El Salvador</option>
                  <option value="GQ">Equatorial Guinea</option>
                  <option value="ER">Eritrea</option>
                  <option value="EE">Estonia</option>
                  <option value="SZ">Eswatini</option>
                  <option value="ET">Ethiopia</option>
                  <option value="FJ">Fiji</option>
                  <option value="FI">Finland</option>
                  <option value="FR">France</option>
                  <option value="GF">French Guiana</option>
                  <option value="PF">French Polynesia</option>
                  <option value="GA">Gabon</option>
                  <option value="GM">Gambia</option>
                  <option value="GE">Georgia</option>
                  <option value="DE">Germany</option>
                  <option value="GH">Ghana</option>
                  <option value="GR">Greece</option>
                  <option value="GL">Greenland</option>
                  <option value="GD">Grenada</option>
                  <option value="GU">Guam</option>
                  <option value="GT">Guatemala</option>
                  <option value="GN">Guinea</option>
                  <option value="GW">Guinea-Bissau</option>
                  <option value="GY">Guyana</option>
                  <option value="HT">Haiti</option>
                  <option value="HN">Honduras</option>
                  <option value="HK">Hong Kong</option>
                  <option value="HU">Hungary</option>
                  <option value="IS">Iceland</option>
                  <option value="IN">India</option>
                  <option value="ID">Indonesia</option>
                  <option value="IR">Iran</option>
                  <option value="IQ">Iraq</option>
                  <option value="IE">Ireland</option>
                  <option value="IL">Israel</option>
                  <option value="IT">Italy</option>
                  <option value="JM">Jamaica</option>
                  <option value="JP">Japan</option>
                  <option value="JO">Jordan</option>
                  <option value="KZ">Kazakhstan</option>
                  <option value="KE">Kenya</option>
                  <option value="KI">Kiribati</option>
                  <option value="KP">Korea (North)</option>
                  <option value="KR">Korea (South)</option>
                  <option value="KW">Kuwait</option>
                  <option value="KG">Kyrgyzstan</option>
                  <option value="LA">Lao People's Democratic Republic</option>
                  <option value="LV">Latvia</option>
                  <option value="LB">Lebanon</option>
                  <option value="LS">Lesotho</option>
                  <option value="LR">Liberia</option>
                  <option value="LY">Libya</option>
                  <option value="LI">Liechtenstein</option>
                  <option value="LT">Lithuania</option>
                  <option value="LU">Luxembourg</option>
                  <option value="MO">Macao</option>
                  <option value="MG">Madagascar</option>
                  <option value="MW">Malawi</option>
                  <option value="MY">Malaysia</option>
                  <option value="MV">Maldives</option>
                  <option value="ML">Mali</option>
                  <option value="MT">Malta</option>
                  <option value="MR">Mauritania</option>
                  <option value="MU">Mauritius</option>
                  <option value="MX">Mexico</option>
                  <option value="FM">Micronesia</option>
                  <option value="MD">Moldova</option>
                  <option value="MC">Monaco</option>
                  <option value="MN">Mongolia</option>
                  <option value="ME">Montenegro</option>
                  <option value="MA">Morocco</option>
                  <option value="MZ">Mozambique</option>
                  <option value="MM">Myanmar</option>
                  <option value="NA">Namibia</option>
                  <option value="NR">Nauru</option>
                  <option value="NP">Nepal</option>
                  <option value="NL">Netherlands</option>
                  <option value="NC">New Caledonia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="NI">Nicaragua</option>
                  <option value="NE">Niger</option>
                  <option value="NG">Nigeria</option>
                  <option value="NO">Norway</option>
                  <option value="OM">Oman</option>
                  <option value="PK">Pakistan</option>
                  <option value="PW">Palau</option>
                  <option value="PA">Panama</option>
                  <option value="PG">Papua New Guinea</option>
                  <option value="PY">Paraguay</option>
                  <option value="PE">Peru</option>
                  <option value="PH">Philippines</option>
                  <option value="PL">Poland</option>
                  <option value="PT">Portugal</option>
                  <option value="PR">Puerto Rico</option>
                  <option value="QA">Qatar</option>
                  <option value="RO">Romania</option>
                  <option value="RU">Russian Federation</option>
                  <option value="RW">Rwanda</option>
                  <option value="WS">Samoa</option>
                  <option value="SM">San Marino</option>
                  <option value="ST">Sao Tome and Principe</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="SN">Senegal</option>
                  <option value="RS">Serbia</option>
                  <option value="SC">Seychelles</option>
                  <option value="SL">Sierra Leone</option>
                  <option value="SG">Singapore</option>
                  <option value="SK">Slovakia</option>
                  <option value="SI">Slovenia</option>
                  <option value="SB">Solomon Islands</option>
                  <option value="SO">Somalia</option>
                  <option value="SS">South Sudan</option>
                  <option value="ES">Spain</option>
                  <option value="LK">Sri Lanka</option>
                  <option value="SD">Sudan</option>
                  <option value="SR">Suriname</option>
                  <option value="SE">Sweden</option>
                  <option value="CH">Switzerland</option>
                  <option value="SY">Syrian Arab Republic</option>
                  <option value="TW">Taiwan</option>
                  <option value="TJ">Tajikistan</option>
                  <option value="TZ">Tanzania</option>
                  <option value="TH">Thailand</option>
                  <option value="TL">Timor-Leste</option>
                  <option value="TG">Togo</option>
                  <option value="TO">Tonga</option>
                  <option value="TT">Trinidad and Tobago</option>
                  <option value="TN">Tunisia</option>
                  <option value="TR">Turkey</option>
                  <option value="TM">Turkmenistan</option>
                  <option value="TV">Tuvalu</option>
                  <option value="UG">Uganda</option>
                  <option value="UA">Ukraine</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="UY">Uruguay</option>
                  <option value="UZ">Uzbekistan</option>
                  <option value="VU">Vanuatu</option>
                  <option value="VE">Venezuela</option>
                  <option value="VN">Viet Nam</option>
                  <option value="YE">Yemen</option>
                  <option value="ZM">Zambia</option>
                  <option value="ZW">Zimbabwe</option>
                </select>
              </div>
              <div class="fc-f2-field">
                <label for="fc2City">City</label>
                <input type="text" id="fc2City" name="MERGE3" placeholder="Your city" autocomplete="address-level2" />
              </div>

              <!-- Row 5: Travel Season | Travel Year -->
              <div class="fc-f2-field">
                <label for="fc2Season">When Would You Like to Travel?</label>
                <select id="fc2Season" name="MERGE4">
                  <option value="" disabled selected>Select season…</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Autumn (Fall)">Autumn (Fall)</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>
              <div class="fc-f2-field">
                <label for="fc2Year">Preferred Year</label>
                <select id="fc2Year" name="MERGE5">
                  <option value="" disabled selected>Select year…</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                </select>
              </div>

              <!-- Row 6: Journey Length — full width -->
              <div class="fc-f2-field fc-f2-span">
                <label for="fc2Length">Preferred Journey Length</label>
                <select id="fc2Length" name="MERGE6">
                  <option value="" disabled selected>Select…</option>
                  <option value="15-Day Signature Journey">15-Day Signature Journey — 4 Provinces</option>
                  <option value="Shorter Regional Experience">Shorter Regional Experience (TBD)</option>
                  <option value="Open to recommendation">Open to recommendation</option>
                </select>
              </div>

              <!-- Row 7: Textarea — full width, 1fr row, fills leftover height -->
              <div class="fc-f2-field fc-f2-span-grow">
                <label for="fc2Why">What Are You Hoping to Experience?</label>
                <textarea
                  id="fc2Why"
                  name="MERGE7"
                  placeholder="Tell us about your travel interests, what you hope to experience, and what draws you to South Africa."
                ></textarea>
              </div>

            </div><!-- /.fc-f2-fg -->

            <!-- Submit -->
            <div class="fc-f2-submit">
              <button type="submit" class="fc-f2-sub-btn" id="fc2Btn">
                Reserve My Place in the Founder's Circle
              </button>
            </div>

            <!-- Legal -->
            <p class="fc-f2-legal">
              By submitting you agree to our <a href="#">Privacy Policy</a>. Your information is held in strict confidence and never shared. Submission does not guarantee membership — spaces are strictly limited.
            </p>

          </form>

        </div><!-- /.fc-f2-card -->

      </div><!-- /.fc-f2-inner -->
    </div><!-- /.fc-f2-form-col -->

  </div><!-- /.fc-f2-outer -->

</section>
